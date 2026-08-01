import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Caixa serves photos at full resolution (~1100px into a 320px slot); allowing the host lets
  // next/image resample them.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "venda-imoveis.caixa.gov.br" }],
  },
  experimental: {
    // Faster navigations: keep rendered segments warm.
    staleTimes: { dynamic: 120, static: 300 },
  },
};

export default nextConfig;
