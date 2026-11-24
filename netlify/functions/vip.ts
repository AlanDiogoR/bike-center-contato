import { getStore } from "@netlify/blobs";
import { handleVip, type VipRateStore } from "@/lib/vip-handler";

declare const Netlify:
  | {
      env?: {
        get(key: string): string | undefined;
      };
    }
  | undefined;

function readRuntimeEnv(key: string): string | undefined {
  if (typeof Netlify !== "undefined" && Netlify?.env?.get) {
    const val = Netlify.env.get(key);
    if (val !== undefined) return val;
  }
  return process.env[key];
}

const runtimeRateStore: VipRateStore = {
  async get(key, options) {
    const store = getStore({ name: "vip-rate", consistency: "strong" });
    if (options?.type === "json") {
      return store.get(key, { type: "json" });
    }
    return store.get(key);
  },
  async setJSON(key, data) {
    const store = getStore({ name: "vip-rate", consistency: "strong" });
    return store.setJSON(key, data);
  },
  async set(key, data) {
    const store = getStore({ name: "vip-rate", consistency: "strong" });
    return store.set(key, data);
  },
};

export default async (req: Request): Promise<Response> => {
  return handleVip(req, {
    env: { get: readRuntimeEnv },
    fetch: globalThis.fetch,
    rateStore: runtimeRateStore,
    now: () => Date.now(),
  });
};

export const config = {
  path: "/api/vip",
  method: ["POST"],
};
