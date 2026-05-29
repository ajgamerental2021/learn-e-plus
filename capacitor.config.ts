import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.learneplus.app',
  appName: 'Learn E+',
  webDir: 'out',
  // Use live server URL (change after deploy)
  server: {
    url: 'https://learn-e-plus.onrender.com',
    cleartext: false,
  },
};

export default config;
