import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ameen.hub',
  appName: 'Ameen Hub',
  webDir: 'out',
  loggingBehavior: process.env.NODE_ENV === 'development' ? 'debug' : 'none',
  server: process.env.CAPACITOR_SERVER_URL
    ? {
        url: process.env.CAPACITOR_SERVER_URL,
        cleartext: true,
      }
    : undefined,
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
