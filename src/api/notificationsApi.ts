import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from '../api/response';

// Define types based on backend contract
export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string; // ISO date string
  readAt: string | null; // ISO date string or null
}

export interface NotificationPreference {
  id: string;
  organizationId: string;
  userId: string;
  notificationType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface UpdatePreferenceDto {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
}

// Map backend notification to AppNotification for UI compatibility
const mapToAppNotification = (notification: Notification): AppNotification => ({
  id: notification.id,
  orgId: notification.organizationId,
  title: notification.title,
  description: notification.message,
  type: notification.type as 'alert' | 'info' | 'success' | 'review',
  timestamp: notification.createdAt,
  read: notification.status === 'READ' || notification.status === 'ARCHIVED',
  linkRoute: notification.data?.linkRoute || undefined
});

export const notificationsApi = {
  // Get all notifications
  async listNotifications(organizationId: string, userId: string): Promise<AppNotification[]> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/notifications`,
      {
        params: {
          userId
        }
      }
    );
    const notifications = unwrapApiResponse<Notification[]>(response.data);
    return notifications.map(mapToAppNotification);
  },

  // Get unread count
  async getUnreadCount(organizationId: string, userId: string): Promise<{ count: number }> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/notifications/unread-count`,
      {
        params: {
          userId
        }
      }
    );
    return unwrapApiResponse<{ count: number }>(response.data);
  },

  // Mark notification as read
  async markNotificationRead(
    organizationId: string,
    userId: string,
    notificationId: string
  ): Promise<AppNotification> {
    const response = await apiClient.patch(
      `/organizations/${organizationId}/notifications/${notificationId}/read`,
      {},
      {
        params: {
          userId
        }
      }
    );
    const notification = unwrapApiResponse<Notification>(response.data);
    return mapToAppNotification(notification);
  },

  // Mark all notifications as read
  async markAllNotificationsRead(
    organizationId: string,
    userId: string
  ): Promise<{ count: number }> {
    const response = await apiClient.patch(
      `/organizations/${organizationId}/notifications/read-all`,
      {},
      {
        params: {
          userId
        }
      }
    );
    return unwrapApiResponse<{ count: number }>(response.data);
  },

  // Get notification preferences
  async getNotificationPreferences(
    organizationId: string,
    userId: string
  ): Promise<NotificationPreference[]> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/notification-preferences`,
      {
        params: {
          userId
        }
      }
    );
    return unwrapApiResponse<NotificationPreference[]>(response.data);
  },

  // Update notification preference
  async updateNotificationPreference(
    organizationId: string,
    userId: string,
    notificationType: string,
    preferences: UpdatePreferenceDto
  ): Promise<NotificationPreference> {
    const response = await apiClient.patch(
      `/organizations/${organizationId}/notification-preferences/${notificationType}`,
      preferences,
      {
        params: {
          userId
        }
      }
    );
    return unwrapApiResponse<NotificationPreference>(response.data);
  }
};