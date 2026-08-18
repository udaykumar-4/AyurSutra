import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Environment = 'development' | 'staging' | 'production';

export const CURRENT_ENV: Environment =
  (process.env.APP_ENV as Environment) ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

// Dynamically extract computer's local Wi-Fi IP address for mobile devices
const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
const devHostIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.31.251';

// Web browser uses localhost:5000, physical mobile phone uses computer Wi-Fi IP
const defaultDevUrl =
  Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : `http://${devHostIp}:5000/api`;

const ENV_CONFIG = {
  development: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || defaultDevUrl,
    appName: 'AyurSutra (Dev)',
    enableLogs: true,
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.ayursutra.com/api',
    appName: 'AyurSutra (Staging)',
    enableLogs: true,
  },
  production: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.ayursutra.com/api',
    appName: 'AyurSutra',
    enableLogs: false,
  },
};

export const config = ENV_CONFIG[CURRENT_ENV] || ENV_CONFIG.development;

export const API_BASE_URL = config.apiUrl;

export default config;
