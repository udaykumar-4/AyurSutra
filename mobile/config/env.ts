import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Environment = 'development' | 'staging' | 'production';

export const CURRENT_ENV: Environment =
  (process.env.APP_ENV as Environment) ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

// Dynamically extract computer's local Wi-Fi IP address for mobile devices
const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;

// Validate IPv4 format. If running via tunnel (e.g., *.exp.direct), debuggerHost is a domain,
// which cannot connect to local port 5000. In that case, fallback to computer's Wi-Fi IP.
const isIpv4 = (host?: string): boolean => {
  if (!host) return false;
  return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
};

const rawHost = debuggerHost ? debuggerHost.split(':')[0] : undefined;
const devHostIp = isIpv4(rawHost) ? rawHost! : '192.168.31.232';

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
