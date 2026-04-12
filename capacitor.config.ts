import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.notelab.app',
  appName: 'NoteLab',
  webDir: 'out',
  server: {
    url: 'https://notelab.studio',
    cleartext: false,
  },
};

export default config;
