import { api } from './client';
import type { UserProfile } from './types';

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string, role: string = 'Community Member') => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
  });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async (): Promise<UserProfile> => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

export const sendOtp = async (email: string) => {
  const response = await api.post('/auth/send-otp', { email });
  return response.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};
