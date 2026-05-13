import { create } from 'axios';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return fromEnv || extra?.apiBaseUrl || 'http://localhost:3000';
};

export const api = create({
  baseURL: `${getBaseUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
