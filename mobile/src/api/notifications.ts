import { api } from './client';
import type { NotificationItem } from './types';

export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data.data as NotificationItem[];
};

export const markNotificationRead = async (notificationId: number) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data.data as NotificationItem;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};
