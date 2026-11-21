import fs from "node:fs";

const vipBuildOn =
  process.env.VIP_ENABLED === "true" &&
  Boolean(process.env.TURNSTILE_SITE_KEY);

const vipLoaderPath = "/tmp/next-vip-pre-loader.cjs";
const loaderSource = `// vipBuildOn=${vipBuildOn}
module.exports = function (source) {
  if (typeof this.addDependency === "function") {
    this.addDependency(${JSON.stringify(vipLoaderPath)});
  }
  const opts = typeof this.getOptions === "function" ? this.getOptions() : {};
  if (opts && opts.vipBuildOn) return source;
  return source
    .replace('import { VIP_ON } from "@/lib/vip";\\n', "")
    .replace('import { VipEntry } from "@/components/VipEntry";\\n', "")
    .replace("\\n        {VIP_ON ? <VipEntry /> : null}\\n", "");
};\n`;

try {
  const current = fs.existsSync(vipLoaderPath)
    ? fs.readFileSync(vipLoaderPath, "utf8")
    : "";
  if (current !== loaderSource) {
    fs.writeFileSync(vipLoaderPath, loaderSource, "utf8");
  }
} catch {
  // ignore if /tmp is unavailable
}

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
  webpack(config, { webpack }) {
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.compilation.tap("StripDisabledVipBranch", (compilation) => {
          webpack.NormalModule.getCompilationHooks(compilation).beforeLoaders.tap(
            "StripDisabledVipBranch",
            (loaders, normalModule) => {
              if (
                normalModule.resource &&
                normalModule.resource.endsWith("src/components/LinksSection.tsx") &&
                !loaders.some((l) => l.loader === vipLoaderPath)
              ) {
                loaders.push({
                  loader: vipLoaderPath,
                  options: { vipBuildOn },
                  ident: null,
                  type: null,
                });
              }
            },
          );
        });
      },
    });
    return config;
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
