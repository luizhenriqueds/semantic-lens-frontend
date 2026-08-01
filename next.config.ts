import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Faster navigations: keep rendered segments warm.
    staleTimes: { dynamic: 120, static: 300 },
  },
};

export default nextConfig;
