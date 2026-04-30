/**
 * notificationService — wraps API calls for in-app notifications.
 * Connected to the Laravel backend API.
 *
 * API endpoints:
 *   GET    /api/v1/notifications
 *   GET    /api/v1/notifications/unread-count
 *   PUT    /api/v1/notifications/{id}/read
 *   PUT    /api/v1/notifications/read-all
 *   DELETE /api/v1/notifications/{id}
 */

import api from '@/lib/api';
import type { AppNotification, BackendNotification, NotificationType } from '@/types/notification';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface NotificationsResponse {
  data: BackendNotification[];
  unread_count: number;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/** Map notification type string to action_url */
function resolveActionUrl(type: string, data: BackendNotification['data']): string | null {
  switch (type) {
    case 'interest_received':
      return '/interests';
    case 'interest_accepted':
      return data.conversation_id ? `/chat/${data.conversation_id}` : '/chat';
    case 'profile_viewed':
      return data.profile_id ? `/profile/${data.profile_id}` : null;
    case 'new_message':
      return data.conversation_id ? `/chat/${data.conversation_id}` : '/chat';
    case 'match_digest':
    case 'match_suggestion':
      return '/matches';
    case 'subscription_expiry':
    case 'subscription_expiring':
      return '/subscription';
    case 'photo_approved':
    case 'photo_rejected':
      return '/profile/edit';
    default:
      return null;
  }
}

/** Transform a backend notification to the frontend AppNotification shape */
function transformNotification(n: BackendNotification): AppNotification {
  const type = n.type as NotificationType;
  return {
    id: n.id,
    type,
    title: n.data.title ?? 'Notification',
    body: n.data.message ?? '',
    action_url: resolveActionUrl(n.type, n.data),
    avatar: null,
    is_read: n.is_read,
    read_at: n.read_at,
    created_at: n.created_at,
    meta: n.data,
  };
}

export const notificationService = {
  /** Fetch all notifications */
  async getAll(): Promise<AppNotification[]> {
    const res = await api.get<ApiResponse<NotificationsResponse>>('/notifications');
    return res.data.data.data.map(transformNotification);
  },

  /** Mark a single notification as read */
  async markRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  /** Mark all notifications as read */
  async markAllRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  /** Delete a notification */
  async destroy(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  /** Get unread count */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  /** Transform a raw backend notification (e.g. from WebSocket) to AppNotification */
  transformNotification,
};
