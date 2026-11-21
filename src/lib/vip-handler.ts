import { createHash } from "node:crypto";
import {
  CONSENT_TEXT_VERSION,
  WHATSAPP_E164_RE,
  isValidVipInteresse,
  normalizeBrWhatsapp,
} from "@/lib/vip";

export const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const VIP_MAX_BODY_BYTES = 4096;
export const VIP_RATE_LIMIT_MAX = 5;
export const VIP_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const TURNSTILE_TIMEOUT_MS = 5000;

export type VipEnvSource =
  | Record<string, string | undefined>
  | { get(key: string): string | undefined };

export interface VipRateStore {
  get(key: string, options?: { type?: "json" | "text" }): Promise<unknown>;
  setJSON?(key: string, data: unknown): Promise<unknown>;
  set?(key: string, data: string): Promise<unknown>;
}

export interface VipHandlerDeps {
  env: VipEnvSource;
  fetch: typeof globalThis.fetch;
  rateStore: VipRateStore;
  now?: number | (() => number);
}

function readEnv(env: VipEnvSource | undefined, key: string): string {
  if (!env) return "";
  if (typeof (env as { get?: unknown }).get === "function") {
    return ((env as { get(k: string): string | undefined }).get(key) ?? "").trim();
  }
  return ((env as Record<string, string | undefined>)[key] ?? "").trim();
}

function resolveNow(now: VipHandlerDeps["now"]): number {
  if (typeof now === "function") return now();
  if (typeof now === "number") return now;
  return Date.now();
}

function jsonResponse(
  status: number,
  payload: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function hashIpKey(salt: string, ip: string): string {
  const digest = createHash("sha256")
    .update(`${salt}${ip}`)
    .digest("hex");
  return `ip:${digest}`;
}

function extractClientIp(req: Request): string {
  const nfIp = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (nfIp) return nfIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

function parseStoredTimestamps(raw: unknown): number[] {
  if (raw == null) return [];
  let data: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    data = JSON.parse(trimmed);
  }
  const list = Array.isArray(data)
    ? data
    : typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { timestamps?: unknown }).timestamps)
      ? (data as { timestamps: unknown[] }).timestamps
      : [];
  return list.filter(
    (item): item is number => typeof item === "number" && Number.isFinite(item),
  );
}

function parseOptionalUtm(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false };
  }
  const trimmed = value.trim();
  if (trimmed.length > 120 || value.length > 120) {
    return { ok: false };
  }
  return { ok: true, value: trimmed || null };
}

export async function handleVip(
  req: Request,
  deps: VipHandlerDeps,
): Promise<Response> {
  // 1. Flag off ou envs obrigatórias ausentes -> 503 sem ler o corpo nem chamar fetch
  const vipEnabled = readEnv(deps?.env, "VIP_ENABLED");
  if (vipEnabled !== "true") {
    return jsonResponse(503, { ok: false, error: "indisponivel" });
  }

  const turnstileSecret = readEnv(deps.env, "TURNSTILE_SECRET");
  const supabaseUrl = readEnv(deps.env, "SUPABASE_URL");
  const supabaseAnonKey = readEnv(deps.env, "SUPABASE_ANON_KEY");
  const vipRateSalt = readEnv(deps.env, "VIP_RATE_SALT");

  if (!turnstileSecret || !supabaseUrl || !supabaseAnonKey || !vipRateSalt) {
    return jsonResponse(503, { ok: false, error: "indisponivel" });
  }

  // 2. Método != POST -> 405; Content-Type != JSON ou corpo > 4 KB -> 400
  if (req.method.toUpperCase() !== "POST") {
    return jsonResponse(
      405,
      { ok: false, error: "metodo_nao_permitido" },
      { Allow: "POST" },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
  }

  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const len = Number(contentLengthHeader);
    if (!Number.isFinite(len) || len > VIP_MAX_BODY_BYTES) {
      return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
    }
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
  }

  const byteLength = new TextEncoder().encode(rawBody).byteLength;
  if (byteLength === 0 || byteLength > VIP_MAX_BODY_BYTES) {
    return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(400, { ok: false, error: "requisicao_invalida" });
  }

  // 3. Honeypot: campo `empresa` preenchido -> 200 { ok: true } sem chamar Turnstile, rate store nem Supabase
  if (
    body.empresa !== undefined &&
    body.empresa !== null &&
    String(body.empresa).trim() !== ""
  ) {
    return jsonResponse(200, { ok: true });
  }

  // 4. Rate limit por IP: 5 / 10 min em janela deslizante (fail-closed -> 503)
  const clientIp = extractClientIp(req);
  const rateKey = hashIpKey(vipRateSalt, clientIp);
  const currentNow = resolveNow(deps.now);

  try {
    if (!deps.rateStore) {
      throw new Error("rateStore ausente");
    }
    const rawStored = await deps.rateStore.get(rateKey, { type: "json" });
    const timestamps = parseStoredTimestamps(rawStored);
    const active = timestamps.filter(
      (ts) => currentNow - ts < VIP_RATE_LIMIT_WINDOW_MS,
    );

    if (active.length >= VIP_RATE_LIMIT_MAX) {
      const oldest = Math.min(...active);
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + VIP_RATE_LIMIT_WINDOW_MS - currentNow) / 1000),
      );
      return jsonResponse(
        429,
        { ok: false, error: "muitas_tentativas" },
        { "Retry-After": String(retryAfterSec) },
      );
    }

    const updated = [...active, currentNow];
    if (typeof deps.rateStore.setJSON === "function") {
      await deps.rateStore.setJSON(rateKey, updated);
    } else if (typeof deps.rateStore.set === "function") {
      await deps.rateStore.set(rateKey, JSON.stringify(updated));
    } else {
      throw new Error("rateStore sem método de escrita");
    }
  } catch {
    return jsonResponse(503, { ok: false, error: "indisponivel" });
  }

  // 5. Turnstile siteverify (form-urlencoded: secret, response, remoteip; timeout 5 s)
  const turnstileToken =
    typeof body.turnstile_token === "string" ? body.turnstile_token.trim() : "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);
  try {
    const formParams = new URLSearchParams({
      secret: turnstileSecret,
      response: turnstileToken,
      remoteip: clientIp,
    });
    const verifyRes = await deps.fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParams.toString(),
      signal: controller.signal,
    });

    if (!verifyRes.ok) {
      return jsonResponse(403, { ok: false, error: "captcha" });
    }
    const verifyJson = (await verifyRes.json()) as { success?: unknown };
    if (!verifyJson || verifyJson.success !== true) {
      return jsonResponse(403, { ok: false, error: "captcha" });
    }
  } catch {
    return jsonResponse(403, { ok: false, error: "captcha" });
  } finally {
    clearTimeout(timeoutId);
  }

  // 6. Validação do corpo (mesmas regras do banco, normalizando WhatsApp no servidor)
  const rawNome = typeof body.nome === "string" ? body.nome : "";
  const nome = rawNome.trim();
  if (nome.length < 1 || nome.length > 80 || rawNome.length > 80) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  const rawWhatsapp =
    typeof body.whatsapp === "string"
      ? body.whatsapp
      : typeof body.whatsapp_e164 === "string"
        ? body.whatsapp_e164
        : "";
  const whatsappE164 = normalizeBrWhatsapp(rawWhatsapp);
  if (!whatsappE164 || !WHATSAPP_E164_RE.test(whatsappE164)) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  if (!isValidVipInteresse(body.interesse)) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  if (body.consent !== true) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  const consentTextVersion =
    typeof body.consent_text_version === "string"
      ? body.consent_text_version
      : "";
  if (
    consentTextVersion !== CONSENT_TEXT_VERSION ||
    consentTextVersion.trim().length < 1 ||
    consentTextVersion.length > 64
  ) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  const utmSourceParsed = parseOptionalUtm(body.utm_source);
  const utmCampaignParsed = parseOptionalUtm(body.utm_campaign);
  if (!utmSourceParsed.ok || !utmCampaignParsed.ok) {
    return jsonResponse(400, { ok: false, error: "dados_invalidos" });
  }

  // 7. Chama a RPC public.vip_lead_signup no Supabase (sem vazar nem logar PII)
  const rpcUrl = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/vip_lead_signup`;
  try {
    const rpcRes = await deps.fetch(rpcUrl, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_nome: nome,
        p_whatsapp_e164: whatsappE164,
        p_interesse: body.interesse,
        p_consent_text_version: CONSENT_TEXT_VERSION,
        p_utm_source: utmSourceParsed.value,
        p_utm_campaign: utmCampaignParsed.value,
      }),
    });

    if (rpcRes.status >= 200 && rpcRes.status < 300) {
      return jsonResponse(200, { ok: true });
    }
    console.error("vip_rpc_status", rpcRes.status);
    return jsonResponse(502, { ok: false, error: "erro_interno" });
  } catch {
    console.error("vip_rpc_status", 502);
    return jsonResponse(502, { ok: false, error: "erro_interno" });
  }
}
