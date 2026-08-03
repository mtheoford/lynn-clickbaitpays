import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.SITES_BUILD !== "true") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["jose"],
  turbopack:
    process.env.SITES_BUILD === "true"
      ? undefined
      : {
          resolveAlias: {
            "@runtime-platform": "./lib/runtime-platform.ts",
          },
        },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
