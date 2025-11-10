import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.ameen.hub',
  appName: 'Ameen Hub',
  // No webDir - we use server mode instead of static export
  loggingBehavior: process.env.NODE_ENV === 'development' ? 'debug' : 'none',
  server: {
    // Always use server mode (dev or production)
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:4000',
    cleartext: process.env.NODE_ENV === 'development', // Only allow HTTP in dev
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    Geolocation: {
      enableHighAccuracy: true,
    },
  },
};

export default config;
