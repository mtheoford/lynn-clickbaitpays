import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/lynn-clickbaitpays",
        assetPrefix: "/lynn-clickbaitpays",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
