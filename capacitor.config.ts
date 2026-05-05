import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riosbaterias.app',
  appName: 'Rios Baterias',
  webDir: 'out',
  server: {
    // URL do seu deploy no Vercel — app abre direto o site, atualizações são automáticas
    url: 'https://rios-baterias-teste-delta.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
