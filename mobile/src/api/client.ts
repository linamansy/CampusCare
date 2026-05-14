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
    'bypass-tunnel-reminder': 'true'
  }
});

// Interceptor to handle multipart/form-data correctly in React Native
api.interceptors.request.use((config) => {
  // Enhanced check for FormData in React Native
  const isFormData = config.data && (
    config.data instanceof FormData || 
    (typeof config.data === 'object' && typeof config.data.append === 'function') ||
    Object.prototype.toString.call(config.data) === '[object FormData]' ||
    (config.data && config.data._parts) // React Native internal property
  );

  if (isFormData) {
    console.log('[API Debug] Detected FormData request to:', config.url);
    
    // In React Native, we MUST NOT set the Content-Type header for FormData,
    // as the underlying XHR will handle it and add the boundary.
    if (config.headers) {
      // For Axios 1.x, we should use the delete method on the headers object if available
      // or set it to undefined to ensure it's not included in the merged headers.
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      
      // Fallback for plain object headers or as an extra precaution
      config.headers['Content-Type'] = undefined;
      config.headers['content-type'] = undefined;
      
      // Ensure Accept is set
      if (typeof config.headers.set === 'function') {
        config.headers.set('Accept', 'application/json');
      } else {
        config.headers['Accept'] = 'application/json';
      }
    }
  } else {
    // For other requests, default to JSON if not already set
    if (config.headers) {
      const hasContentType = typeof config.headers.has === 'function' 
        ? (config.headers.has('Content-Type') || config.headers.has('content-type'))
        : (config.headers['Content-Type'] || config.headers['content-type']);
        
      if (!hasContentType) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Content-Type', 'application/json');
        } else {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }
  }
  return config;
}, (error) => {
  console.error('[API Debug] Request Error:', error);
  return Promise.reject(error);
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
