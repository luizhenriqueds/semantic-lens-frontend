import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Faster navigations: keep rendered segments warm.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
