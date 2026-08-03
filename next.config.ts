import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.SITES_BUILD !== "true") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["jose"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
