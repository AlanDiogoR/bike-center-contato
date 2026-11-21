/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_VIP_ENABLED:
      process.env.VIP_ENABLED === "true" ? "true" : "",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.VIP_ENABLED === "true"
        ? (process.env.TURNSTILE_SITE_KEY ?? "")
        : "",
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.svg",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
