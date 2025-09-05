import { createApiClientWithToken } from './client';
import type { User } from '@/lib/types';

export interface Notification {
  id: number;
  notif_type: 'new_quest' | 'quest_validated' | 'quest_rejected';
  created_at: string;
  updated_at: string;
  seen: boolean;
  quest_id: number;
  to_user: number;
  admin_id: number | null;
  title?: string;
  message?: string;
}

export interface AdminNotification {
  id: number;
  notif_type: 'pending_quest' | 'quest_validated' | 'quest_rejected';
  created_at: string;
  updated_at: string;
  seen: boolean;
  quest_id: number;
  to_user: number | null;
  admin_id: number;
}

export const UsersApi = {
  async list(token?: string): Promise<User[]> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/user/admin/all');
    return data;
  },
  async get(userId: string, token?: string): Promise<User> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get(`/api/users/${userId}`);
    return data;
  },
  async update(userId: string, updates: Partial<User>, token?: string): Promise<User> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.patch(`/api/users/${userId}`, updates);
    return data;
  },
  async getNotifications(token?: string): Promise<{ notifications: Notification[] }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/user/notifications');
    return data;
  },
  async getUnreadNotificationCount(token?: string): Promise<{ status: string; notification_number: number }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/user/notification/number');
    return data;
  },
  // Admin notification functions
  async getAdminNotifications(token?: string): Promise<{ notifications: AdminNotification[] }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/admin/notifications');
    return data;
  },
  async getAdminUnreadNotificationCount(token?: string): Promise<{ status: string; notification_number: number }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/admin/notification/number');
    return data;
  },
  // Mark notifications as seen
  async markNotificationAsSeen(notificationId: number, token?: string): Promise<{ status: string; message: string }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.put(`/user/notifications/${notificationId}/mark-as-seen`);
    return data;
  },
  async markAdminNotificationAsSeen(notificationId: number, token?: string): Promise<{ status: string; message: string }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.put(`/admin/notifications/${notificationId}/mark-as-seen`);
    return data;
  }
};


