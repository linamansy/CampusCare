import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as AuthApi from '../api/auth';
import type { UserProfile } from '../api/types';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'campuscare.token';
const USER_KEY = 'campuscare.user';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string | null>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedToken) {
          setAuthToken(savedToken);
          setToken(savedToken);
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const persistSession = async (nextToken: string, nextUser: UserProfile) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearSession = async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await AuthApi.login(email, password);
    await persistSession(response.accessToken, response.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string) => {
    await AuthApi.register(name, email, password, role);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch {
      // ignore
    }
    await clearSession();
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await AuthApi.getMe();
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    await AuthApi.sendOtp(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await AuthApi.verifyOtp(email, otp);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await AuthApi.forgotPassword(email);
    return response.resetToken || null;
  }, []);

  const resetPassword = useCallback(async (tokenValue: string, newPassword: string) => {
    await AuthApi.resetPassword(tokenValue, newPassword);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      register,
      signOut,
      refreshUser,
      sendOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
    }),
    [user, token, loading, signIn, register, signOut, refreshUser, sendOtp, verifyOtp, forgotPassword, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
