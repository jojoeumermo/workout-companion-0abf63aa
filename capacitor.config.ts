import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitai.coach',
  appName: 'FitAI Coach',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // When building the APK, set the URL below to your deployed server.
    // Example: url: 'https://your-replit-app.replit.app'
    // Leave commented out to bundle web assets inside the APK.
    // url: 'https://YOUR_DEPLOYED_URL.replit.app',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
