import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar indicadores de desenvolvimento
  devIndicators: {
    position: 'top-right',
  },
  env: {
    DISABLE_DEV_OVERLAY: 'true',
  },
};

export default nextConfig;
