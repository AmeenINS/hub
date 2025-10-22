import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to suppress warning
  turbopack: {},
  
  // External packages that should not be bundled
  serverExternalPackages: ['lmdb', 'argon2', 'cbor-x', 'msgpackr'],
};

export default nextConfig;
