import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Increase the default 1MB limit to accommodate larger payloads/uploads
      bodySizeLimit: '50mb',
      // allowedOrigins: ['http://localhost:3000'], // optionally restrict origins
    },
  },
};

export default nextConfig;
