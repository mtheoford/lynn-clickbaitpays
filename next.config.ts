import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  serverExternalPackages: ["jose"],
  turbopack: {
    resolveAlias: {
      "@runtime-platform": "./lib/runtime-platform.ts",
    },
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
