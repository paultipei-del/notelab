import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.notelab.app',
  appName: 'NoteLab',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.21:3000',
    cleartext: true,
  },
};

export default config;
