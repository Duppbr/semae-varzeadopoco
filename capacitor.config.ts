import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riosbaterias.app',
  appName: 'Rios Baterias',
  // App local: serve arquivos da pasta mobile/ direto do dispositivo
  // Sem server.url = sem depender de internet para carregar o shell do app
  webDir: 'mobile',
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
