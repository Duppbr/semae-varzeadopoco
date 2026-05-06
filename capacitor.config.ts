import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riosbaterias.app',
  appName: 'Rios Baterias',
  webDir: 'mobile',
  server: {
    // App abre o site completo do Vercel — toda atualização do site reflete automaticamente
    url: 'https://rios-baterias-teste-delta.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
