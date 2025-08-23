import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
