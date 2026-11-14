/** URL pública do hub. Fallback quando NEXT_PUBLIC_SITE_URL não está definida. */
export const DEFAULT_SITE_URL = "https://contatobikecenter.netlify.app";

/**
 * Base pública sem barra final para canonical, Open Graph, JSON-LD,
 * sitemap e robots. Sem env, ou com localhost, usa a URL pública.
 */
export function getSiteUrl(
  env: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const raw = env?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return DEFAULT_SITE_URL;
    }
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = getSiteUrl();
