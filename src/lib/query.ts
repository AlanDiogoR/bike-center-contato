/**
 * Normaliza a chave de uma query string: decodifica `+` e `%xx`,
 * troca `%20` restante por espaço, aplica trim, minúsculas e remove
 * espaços internos. Assim `utm _campaign`, `utm%20_campaign` e
 * `UTM_Source` viram `utm_campaign` / `utm_source`.
 */
export function normalizeQueryKey(key: string): string {
  const plusAsSpace = key.replace(/\+/g, " ");
  let decoded = plusAsSpace;
  try {
    decoded = decodeURIComponent(plusAsSpace);
  } catch {
    decoded = plusAsSpace;
  }
  return decoded.replace(/%20/gi, " ").trim().toLowerCase().replace(/\s+/g, "");
}

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Primeiro valor de cada chave já normalizada. Valores não são reescritos. */
export function parseNormalizedSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const out: Record<string, string> = {};
  const seen = new Set<string>();
  params.forEach((value, rawKey) => {
    const key = normalizeQueryKey(rawKey);
    if (!key || BLOCKED_KEYS.has(key) || seen.has(key)) return;
    seen.add(key);
    out[key] = value;
  });
  return out;
}

/** `utm_source=placa`, com chave normalizada e valor só com trim + minúsculas. */
export function isPlacaUtmSource(search: string): boolean {
  const source = parseNormalizedSearch(search).utm_source;
  return typeof source === "string" && source.trim().toLowerCase() === "placa";
}
