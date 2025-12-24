import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disabled to allow route segment config (dynamic, dynamicParams, etc.)
    // cacheComponents: true,
  },
};

export default nextConfig;
