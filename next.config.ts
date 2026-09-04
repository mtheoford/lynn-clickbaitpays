import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  serverExternalPackages: ["jose"],
  async headers() {
    return [
      {
        source: "/fr/:path*",
        headers: [{ key: "Content-Language", value: "fr" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "lynn-theobald.cbp.proneurs.org" }],
        destination: "https://cbp.proneurs.org/s/your-name",
        permanent: true,
      },
      {
        source: "/s/lynn-theobald",
        destination: "/s/your-name",
        permanent: true,
      },
    ];
  },
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
