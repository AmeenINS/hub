import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that should not be bundled
  serverExternalPackages: ['lmdb', 'argon2', 'cbor-x', 'msgpackr'],
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Disable image optimization for local files
  },
};

export default nextConfig;
