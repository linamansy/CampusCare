import { api } from './client';
import type { UserProfile, UserRole } from './types';

export interface AdminAnalyticsResponse {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    totalIssues: number;
  };
  usersByRole: { role: string; count: number }[];
  issuesByStatus: { status: string; count: number }[];
}

export const fetchUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data as UserProfile[];
};

export const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) => {
  const response = await api.post('/users', payload);
  return response.data as UserProfile;
};

export const activateUser = async (userId: number) => {
  const response = await api.put(`/admin/users/${userId}/activate`);
  return response.data.user as UserProfile;
};

export const deactivateUser = async (userId: number) => {
  const response = await api.put(`/admin/users/${userId}/deactivate`);
  return response.data.user as UserProfile;
};

export const promoteUserRole = async (userId: number, role: UserRole) => {
  const response = await api.put(`/admin/users/${userId}/promote`, { role });
  return response.data.user as UserProfile;
};

export const verifyUser = async (userId: number) => {
  const response = await api.put(`/admin/users/${userId}/verify`);
  return response.data.user as UserProfile;
};

export const resetUserPassword = async (userId: number, newPassword: string) => {
  const response = await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
  return response.data.user as UserProfile;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data.user as Pick<UserProfile, 'id' | 'name' | 'email'>;
};

export const fetchAdminAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data as AdminAnalyticsResponse;
};

export const fetchCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data.categories as string[];
};

export const createCategory = async (name: string) => {
  const response = await api.post('/admin/categories', { name });
  return response.data.categories as string[];
};

export const updateCategory = async (currentName: string, name: string) => {
  const response = await api.put(`/admin/categories/${encodeURIComponent(currentName)}`, { name });
  return response.data.categories as string[];
};

export const deleteCategory = async (name: string) => {
  const response = await api.delete(`/admin/categories/${encodeURIComponent(name)}`);
  return response.data.categories as string[];
};
