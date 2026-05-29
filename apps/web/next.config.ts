import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@playable-worlds/core", "@playable-worlds/content"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
