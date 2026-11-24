import { describe, expect, it, vi } from "vitest";
import { CONSENT_TEXT_VERSION, TURNSTILE_ACTION } from "./vip";
import {
  DEFAULT_VIP_ALLOWED_HOST,
  TURNSTILE_SITEVERIFY_URL,
  getAllowedHosts,
  handleVip,
  type VipRateStore,
} from "./vip-handler";

const CF_TEST_SECRET_PASS = "1x0000000000000000000000000000000AA";
const CF_TEST_SECRET_FAIL = "2x0000000000000000000000000000000AA";

function createBaseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    VIP_ENABLED: "true",
    TURNSTILE_SECRET: CF_TEST_SECRET_PASS,
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    VIP_RATE_SALT: "test-rate-salt-2026",
    ...overrides,
  };
}

function createMemoryRateStore() {
  const map = new Map<string, unknown>();
  const store: VipRateStore & { map: Map<string, unknown> } = {
    map,
    get: vi.fn(async (key: string) => map.get(key) ?? null),
    setJSON: vi.fn(async (key: string, data: unknown) => {
      map.set(key, data);
    }),
    set: vi.fn(async (key: string, data: string) => {
      map.set(key, JSON.parse(data));
    }),
  };
  return store;
}

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    nome: "Maria Silva",
    whatsapp: "(14) 99166-7793",
    interesse: "ambos",
    consent: true,
    consent_text_version: CONSENT_TEXT_VERSION,
    turnstile_token: "cf-turnstile-token-ok",
    utm_source: "instagram",
    utm_campaign: "lancamento_vip",
    empresa: "",
    ...overrides,
  };
}

function makePostRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("https://contatobikecenter.netlify.app/api/vip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
      "x-nf-client-connection-ip": "203.0.113.42",
      ...headers,
    },
    body: raw,
  });
}

function createMockFetch(options?: {
  turnstileSuccess?: boolean;
  turnstileHostname?: string | null;
  turnstileAction?: string | null;
  supabaseStatus?: number;
}) {
  const turnstileSuccess = options?.turnstileSuccess ?? true;
  const turnstileHostname =
    options?.turnstileHostname === undefined
      ? DEFAULT_VIP_ALLOWED_HOST
      : options.turnstileHostname;
  const turnstileAction =
    options?.turnstileAction === undefined
      ? TURNSTILE_ACTION
      : options.turnstileAction;
  const supabaseStatus = options?.supabaseStatus ?? 204;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === TURNSTILE_SITEVERIFY_URL) {
      const params = new URLSearchParams(String(init?.body ?? ""));
      const secret = params.get("secret");
      const pass =
        secret === CF_TEST_SECRET_FAIL ? false : turnstileSuccess;
      return new Response(
        JSON.stringify({
          success: pass,
          ...(turnstileHostname !== null ? { hostname: turnstileHostname } : {}),
          ...(turnstileAction !== null ? { action: turnstileAction } : {}),
          "error-codes": pass ? [] : ["invalid-input-response"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (url.endsWith("/rest/v1/rpc/vip_lead_signup")) {
      return new Response(null, { status: supabaseStatus });
    }

    throw new Error(`URL inesperada no mock de fetch: ${url}`);
  });
}

describe("handleVip (/api/vip)", () => {
  it("1. Flag off: devolve 503 sem ler o corpo nem chamar fetch ou rateStore", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();
    let bodyRead = false;

    const req = {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      text: async () => {
        bodyRead = true;
        return JSON.stringify(createValidPayload());
      },
    } as unknown as Request;

    const res = await handleVip(req, {
      env: createBaseEnv({ VIP_ENABLED: "false" }),
      fetch: fetchMock,
      rateStore,
    });

    expect(res.status).toBe(503);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: false, error: "indisponivel" });
    expect(bodyRead).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
  });

  it("devolve 503 quando a flag está ligada mas falta variável obrigatória de servidor", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();
    const res = await handleVip(makePostRequest(createValidPayload()), {
      env: createBaseEnv({ TURNSTILE_SECRET: "" }),
      fetch: fetchMock,
      rateStore,
    });
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();

    // Sem SUPABASE_SERVICE_ROLE_KEY -> 503 e zero chamadas a fetch/store
    const resMissingServiceRole = await handleVip(
      makePostRequest(createValidPayload()),
      {
        env: createBaseEnv({ SUPABASE_SERVICE_ROLE_KEY: "" }),
        fetch: fetchMock,
        rateStore,
      },
    );
    expect(resMissingServiceRole.status).toBe(503);
    expect(await resMissingServiceRole.json()).toEqual({
      ok: false,
      error: "indisponivel",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
    expect(rateStore.setJSON).not.toHaveBeenCalled();

    // Só com a antiga chave anon (sem SUPABASE_SERVICE_ROLE_KEY) -> 503 (sem fallback)
    const legacyAnonEnvKey = ["SUPABASE", "ANON", "KEY"].join("_");
    const resOnlyLegacyAnon = await handleVip(
      makePostRequest(createValidPayload()),
      {
        env: createBaseEnv({
          SUPABASE_SERVICE_ROLE_KEY: undefined,
          [legacyAnonEnvKey]: "test-anon-key",
        }),
        fetch: fetchMock,
        rateStore,
      },
    );
    expect(resOnlyLegacyAnon.status).toBe(503);
    expect(await resOnlyLegacyAnon.json()).toEqual({
      ok: false,
      error: "indisponivel",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
    expect(rateStore.setJSON).not.toHaveBeenCalled();
  });

  it("rejeita método diferente de POST com 405, Content-Type inválido ou corpo > 4 KB com 400", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();
    const env = createBaseEnv();

    const getReq = new Request("https://contatobikecenter.netlify.app/api/vip", {
      method: "GET",
    });
    const res405 = await handleVip(getReq, { env, fetch: fetchMock, rateStore });
    expect(res405.status).toBe(405);

    const textReq = new Request("https://contatobikecenter.netlify.app/api/vip", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
      },
      body: "plain",
    });
    const res400Type = await handleVip(textReq, {
      env,
      fetch: fetchMock,
      rateStore,
    });
    expect(res400Type.status).toBe(400);

    const hugeReq = makePostRequest({
      ...createValidPayload(),
      extra: "x".repeat(5000),
    });
    const res400Size = await handleVip(hugeReq, {
      env,
      fetch: fetchMock,
      rateStore,
    });
    expect(res400Size.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Origin: rejeita requisição sem Origin, com Origin de outro site ou http:// com 403 { ok:false, error:'origem' } sem ler corpo nem chamar fetch/rateStore, e aceita Origin https://<host> permitido", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();
    const env = createBaseEnv();

    // 1. Sem Origin -> 403 sem ler o corpo
    let bodyRead = false;
    const reqNoOrigin = {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "x-nf-client-connection-ip": "203.0.113.42",
      }),
      text: async () => {
        bodyRead = true;
        return JSON.stringify(createValidPayload());
      },
    } as unknown as Request;
    const resNoOrigin = await handleVip(reqNoOrigin, {
      env,
      fetch: fetchMock,
      rateStore,
    });
    expect(resNoOrigin.status).toBe(403);
    expect(await resNoOrigin.json()).toEqual({ ok: false, error: "origem" });
    expect(bodyRead).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();

    // 2. Origin de outro site -> 403
    const resOtherOrigin = await handleVip(
      makePostRequest(createValidPayload(), {
        Origin: "https://evil.example.org",
      }),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resOtherOrigin.status).toBe(403);
    expect(await resOtherOrigin.json()).toEqual({ ok: false, error: "origem" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();

    // 3. http:// do host permitido -> 403
    const resHttpOrigin = await handleVip(
      makePostRequest(createValidPayload(), {
        Origin: `http://${DEFAULT_VIP_ALLOWED_HOST}`,
      }),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resHttpOrigin.status).toBe(403);
    expect(await resHttpOrigin.json()).toEqual({ ok: false, error: "origem" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();

    // 4. Origin permitido -> 200
    const resAllowed = await handleVip(
      makePostRequest(createValidPayload(), {
        Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
      }),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resAllowed.status).toBe(200);
  });

  it("getAllowedHosts e validação de hostname/action no siteverify", async () => {
    // Padrão: contatobikecenter.netlify.app + hosts de URL e DEPLOY_PRIME_URL
    expect(getAllowedHosts(createBaseEnv())).toEqual([
      "contatobikecenter.netlify.app",
    ]);
    expect(
      getAllowedHosts(
        createBaseEnv({
          URL: "https://bikecenterfartura.com.br",
          DEPLOY_PRIME_URL:
            "https://deploy-preview-15--contatobikecenter.netlify.app/alguma-rota",
        }),
      ),
    ).toEqual([
      "contatobikecenter.netlify.app",
      "bikecenterfartura.com.br",
      "deploy-preview-15--contatobikecenter.netlify.app",
    ]);

    // VIP_ALLOWED_HOSTS substitui o padrão integralmente (trim, minúsculas, sem esquema/porta)
    expect(
      getAllowedHosts(
        createBaseEnv({
          VIP_ALLOWED_HOSTS:
            "  BikeCenterFartura.com.br , preview.bikecenter.com.br ",
          URL: "https://ignored-when-override.netlify.app",
        }),
      ),
    ).toEqual(["bikecenterfartura.com.br", "preview.bikecenter.com.br"]);

    const rateStore = createMemoryRateStore();

    // Hostname fora da allowlist no siteverify -> 403 captcha e não chama Supabase
    const fetchWrongHost = createMockFetch({
      turnstileSuccess: true,
      turnstileHostname: "outro-dominio.com",
      turnstileAction: TURNSTILE_ACTION,
    });
    const resWrongHost = await handleVip(makePostRequest(createValidPayload()), {
      env: createBaseEnv(),
      fetch: fetchWrongHost,
      rateStore,
    });
    expect(resWrongHost.status).toBe(403);
    expect(await resWrongHost.json()).toEqual({ ok: false, error: "captcha" });
    expect(fetchWrongHost).toHaveBeenCalledTimes(1);

    // Action errada no siteverify -> 403 captcha
    const fetchWrongAction = createMockFetch({
      turnstileSuccess: true,
      turnstileHostname: DEFAULT_VIP_ALLOWED_HOST,
      turnstileAction: "login",
    });
    const resWrongAction = await handleVip(
      makePostRequest(createValidPayload()),
      {
        env: createBaseEnv(),
        fetch: fetchWrongAction,
        rateStore,
      },
    );
    expect(resWrongAction.status).toBe(403);
    expect(await resWrongAction.json()).toEqual({ ok: false, error: "captcha" });
    expect(fetchWrongAction).toHaveBeenCalledTimes(1);

    // Action ausente no siteverify -> 403 captcha
    const fetchMissingAction = createMockFetch({
      turnstileSuccess: true,
      turnstileHostname: DEFAULT_VIP_ALLOWED_HOST,
      turnstileAction: null,
    });
    const resMissingAction = await handleVip(
      makePostRequest(createValidPayload()),
      {
        env: createBaseEnv(),
        fetch: fetchMissingAction,
        rateStore,
      },
    );
    expect(resMissingAction.status).toBe(403);
    expect(await resMissingAction.json()).toEqual({
      ok: false,
      error: "captcha",
    });
    expect(fetchMissingAction).toHaveBeenCalledTimes(1);

    // VIP_ALLOWED_HOSTS substitui o padrão: contatobikecenter.netlify.app deixa de ser aceito e o custom passa
    const customEnv = createBaseEnv({
      VIP_ALLOWED_HOSTS: "vip.bikecenter.com.br",
    });
    const fetchCustom = createMockFetch({
      turnstileSuccess: true,
      turnstileHostname: "VIP.BIKECENTER.COM.BR",
      turnstileAction: TURNSTILE_ACTION,
    });
    const resDefaultRejected = await handleVip(
      makePostRequest(createValidPayload(), {
        Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
      }),
      { env: customEnv, fetch: fetchCustom, rateStore },
    );
    expect(resDefaultRejected.status).toBe(403);
    expect(await resDefaultRejected.json()).toEqual({
      ok: false,
      error: "origem",
    });

    const resCustomOk = await handleVip(
      makePostRequest(createValidPayload(), {
        Origin: "https://vip.bikecenter.com.br",
      }),
      { env: customEnv, fetch: fetchCustom, rateStore },
    );
    expect(resCustomOk.status).toBe(200);
    expect(await resCustomOk.json()).toEqual({ ok: true });
  });

  it("2. Honeypot: empresa preenchido devolve 200 { ok: true } e zero chamadas a fetch e rateStore", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();

    const res = await handleVip(
      makePostRequest(createValidPayload({ empresa: "Spam Bot Ltda" })),
      {
        env: createBaseEnv(),
        fetch: fetchMock,
        rateStore,
      },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
    expect(rateStore.setJSON).not.toHaveBeenCalled();
  });

  it("IP do cliente: exige x-nf-client-connection-ip e devolve 503 sem chamar fetch ou rateStore quando ausente ou quando só há X-Forwarded-For", async () => {
    const fetchMock = createMockFetch();
    const rateStore = createMemoryRateStore();
    const env = createBaseEnv();

    // Sem x-nf-client-connection-ip -> 503
    const reqNoIp = new Request(
      "https://contatobikecenter.netlify.app/api/vip",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
        },
        body: JSON.stringify(createValidPayload()),
      },
    );
    const resNoIp = await handleVip(reqNoIp, {
      env,
      fetch: fetchMock,
      rateStore,
    });
    expect(resNoIp.status).toBe(503);
    expect(await resNoIp.json()).toEqual({ ok: false, error: "indisponivel" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
    expect(rateStore.setJSON).not.toHaveBeenCalled();

    // Só com X-Forwarded-For (sem x-nf-client-connection-ip) -> 503
    const reqOnlyXff = new Request(
      "https://contatobikecenter.netlify.app/api/vip",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: `https://${DEFAULT_VIP_ALLOWED_HOST}`,
          "X-Forwarded-For": "198.51.100.10",
        },
        body: JSON.stringify(createValidPayload()),
      },
    );
    const resOnlyXff = await handleVip(reqOnlyXff, {
      env,
      fetch: fetchMock,
      rateStore,
    });
    expect(resOnlyXff.status).toBe(503);
    expect(await resOnlyXff.json()).toEqual({
      ok: false,
      error: "indisponivel",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rateStore.get).not.toHaveBeenCalled();
  });

  it("3. Turnstile: secret de falha (2x...AA / success:false) devolve 403 e não chama Supabase; secret de sucesso (1x...AA / success:true) envia secret, response e remoteip", async () => {
    const rateStore = createMemoryRateStore();
    const fetchFail = createMockFetch({ turnstileSuccess: false });

    const resFail = await handleVip(
      makePostRequest(
        createValidPayload({ turnstile_token: "tok-fail" }),
        { "x-nf-client-connection-ip": "198.51.100.77" },
      ),
      {
        env: createBaseEnv({ TURNSTILE_SECRET: CF_TEST_SECRET_FAIL }),
        fetch: fetchFail,
        rateStore,
      },
    );

    expect(resFail.status).toBe(403);
    expect(await resFail.json()).toEqual({ ok: false, error: "captcha" });
    expect(fetchFail).toHaveBeenCalledTimes(1);
    const [calledUrlFail, calledInitFail] = fetchFail.mock.calls[0];
    expect(calledUrlFail).toBe(TURNSTILE_SITEVERIFY_URL);
    const failParams = new URLSearchParams(String(calledInitFail?.body));
    expect(failParams.get("secret")).toBe(CF_TEST_SECRET_FAIL);
    expect(failParams.get("response")).toBe("tok-fail");
    expect(failParams.get("remoteip")).toBe("198.51.100.77");

    // Agora com secret de teste que passa (1x...AA)
    const fetchPass = createMockFetch({ turnstileSuccess: true });
    const resPass = await handleVip(
      makePostRequest(
        createValidPayload({ turnstile_token: "tok-pass" }),
        { "x-nf-client-connection-ip": "198.51.100.77" },
      ),
      {
        env: createBaseEnv({ TURNSTILE_SECRET: CF_TEST_SECRET_PASS }),
        fetch: fetchPass,
        rateStore,
      },
    );

    expect(resPass.status).toBe(200);
    expect(await resPass.json()).toEqual({ ok: true });
    expect(fetchPass).toHaveBeenCalledTimes(2);
    const [verifyUrl, verifyInit] = fetchPass.mock.calls[0];
    expect(verifyUrl).toBe(TURNSTILE_SITEVERIFY_URL);
    const passParams = new URLSearchParams(String(verifyInit?.body));
    expect(passParams.get("secret")).toBe(CF_TEST_SECRET_PASS);
    expect(passParams.get("response")).toBe("tok-pass");
    expect(passParams.get("remoteip")).toBe("198.51.100.77");
  });

  it("4. Rate limit: 5 envios do mesmo IP em 10 min passam, 6º devolve 429 com Retry-After, após 10 min passa novamente, chave é hash sem IP em claro e erro do store devolve 503", async () => {
    const rateStore = createMemoryRateStore();
    const fetchMock = createMockFetch();
    const env = createBaseEnv();
    const ip = "203.0.113.99";
    let currentNow = 1_700_000_000_000;

    for (let i = 0; i < 5; i++) {
      currentNow += 1000;
      const res = await handleVip(
        makePostRequest(createValidPayload(), {
          "x-nf-client-connection-ip": ip,
        }),
        {
          env,
          fetch: fetchMock,
          rateStore,
          now: () => currentNow,
        },
      );
      expect(res.status).toBe(200);
    }

    // Verifica que a chave guardada no store é hash ip:<sha256> e nunca contém o IP em claro
    const keys = Array.from(rateStore.map.keys());
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^ip:[a-f0-9]{64}$/);
    expect(keys[0]).not.toContain(ip);
    expect(JSON.stringify(Array.from(rateStore.map.entries()))).not.toContain(ip);

    // 6º envio dentro da janela de 10 min -> 429 com Retry-After
    currentNow += 1000;
    const res6 = await handleVip(
      makePostRequest(createValidPayload(), {
        "x-nf-client-connection-ip": ip,
      }),
      {
        env,
        fetch: fetchMock,
        rateStore,
        now: () => currentNow,
      },
    );
    expect(res6.status).toBe(429);
    const retryAfter = Number(res6.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(600);

    // Avança 10 minutos -> volta a passar
    currentNow += 10 * 60 * 1000;
    const resAfterWindow = await handleVip(
      makePostRequest(createValidPayload(), {
        "x-nf-client-connection-ip": ip,
      }),
      {
        env,
        fetch: fetchMock,
        rateStore,
        now: () => currentNow,
      },
    );
    expect(resAfterWindow.status).toBe(200);

    // Erro do store -> 503 (fail-closed)
    const brokenStore: VipRateStore = {
      get: vi.fn(async () => {
        throw new Error("Blob store offline");
      }),
      setJSON: vi.fn(),
    };
    const res503 = await handleVip(
      makePostRequest(createValidPayload(), {
        "x-nf-client-connection-ip": ip,
      }),
      {
        env,
        fetch: fetchMock,
        rateStore: brokenStore,
        now: () => currentNow,
      },
    );
    expect(res503.status).toBe(503);
    expect(await res503.json()).toEqual({ ok: false, error: "indisponivel" });
  });

  it("4b. Telefone repetido: chama a RPC e devolve exatamente a mesma resposta 200 { ok: true } do primeiro cadastro (sem enumeração)", async () => {
    const rateStore = createMemoryRateStore();
    const fetchMock = createMockFetch();
    const env = createBaseEnv();

    const first = await handleVip(makePostRequest(createValidPayload()), {
      env,
      fetch: fetchMock,
      rateStore,
    });
    const second = await handleVip(makePostRequest(createValidPayload()), {
      env,
      fetch: fetchMock,
      rateStore,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const body1 = await first.json();
    const body2 = await second.json();
    expect(body1).toEqual({ ok: true });
    expect(body2).toEqual(body1);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 2 siteverify + 2 RPC
  });

  it("5. Sucesso e validação: chama RPC /rest/v1/rpc/vip_lead_signup com telefone normalizado e UTMs, e rejeita consentimento ausente ou versão errada com 400", async () => {
    const rateStore = createMemoryRateStore();
    const fetchMock = createMockFetch();
    const env = createBaseEnv();

    const res = await handleVip(
      makePostRequest(
        createValidPayload({
          nome: "  Carlos Eduardo  ",
          whatsapp: "(14) 99166-7793",
          interesse: "moto",
          utm_source: "placa_qr",
          utm_campaign: "verao",
        }),
      ),
      {
        env,
        fetch: fetchMock,
        rateStore,
      },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });

    const [rpcUrl, rpcInit] = fetchMock.mock.calls[1];
    expect(rpcUrl).toBe("https://example.supabase.co/rest/v1/rpc/vip_lead_signup");
    const rpcHeaders = rpcInit?.headers as Record<string, string>;
    expect(rpcHeaders.apikey).toBe("test-service-role-key");
    expect(rpcHeaders.Authorization).toBe("Bearer test-service-role-key");
    expect(JSON.parse(String(rpcInit?.body))).toEqual({
      p_nome: "Carlos Eduardo",
      p_whatsapp_e164: "+5514991667793",
      p_interesse: "moto",
      p_consent_text_version: CONSENT_TEXT_VERSION,
      p_utm_source: "placa_qr",
      p_utm_campaign: "verao",
    });

    // Consentimento ausente -> 400
    const resNoConsent = await handleVip(
      makePostRequest(createValidPayload({ consent: false })),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resNoConsent.status).toBe(400);

    // Versão de consentimento errada -> 400
    const resWrongVersion = await handleVip(
      makePostRequest(
        createValidPayload({ consent_text_version: "versao-antiga" }),
      ),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resWrongVersion.status).toBe(400);

    // Telefone inválido -> 400
    const resBadPhone = await handleVip(
      makePostRequest(createValidPayload({ whatsapp: "123" })),
      { env, fetch: fetchMock, rateStore },
    );
    expect(resBadPhone.status).toBe(400);
  });
});
