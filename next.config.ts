import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.69.2', '192.168.69.*'],
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
