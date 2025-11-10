import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // External packages that should not be bundled
  serverExternalPackages: ['lmdb', 'argon2', 'cbor-x', 'msgpackr'],
  
  // Base path for static export (optional)
  // basePath: '',
  
  // Trailing slash for static export
  trailingSlash: true,
};

export default nextConfig;
