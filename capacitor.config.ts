import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.gov.varzeadopoco.semae',
  appName: 'SEMAE',
  webDir: 'mobile',
  server: {
    // App abre o site completo do Vercel — atualizações automáticas sem republicar APK
    url: 'https://semae-varzeadopoco.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#f1f5f9',
  },
};

export default config;
