/**
 * notificationService — wraps API calls for in-app notifications.
 * Currently uses demo data; swap with real API calls when backend is ready.
 *
 * API shape (future):
 *   GET    /api/v1/notifications
 *   PUT    /api/v1/notifications/{id}/read
 *   PUT    /api/v1/notifications/read-all
 *   DELETE /api/v1/notifications/{id}
 */

import type { AppNotification } from '@/types/notification';
import { DEMO_NOTIFICATIONS } from '@/lib/demo-data';

// In-memory mutable copy
let notifications: AppNotification[] = JSON.parse(JSON.stringify(DEMO_NOTIFICATIONS)) as AppNotification[];

function sleep(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const notificationService = {
  /** Fetch all notifications */
  async getAll(): Promise<AppNotification[]> {
    await sleep();
    return [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // ── Real API call ──
    // const res = await api.get<ApiResponse<AppNotification[]>>('/notifications');
    // return res.data.data;
  },

  /** Mark a single notification as read */
  async markRead(id: string): Promise<void> {
    await sleep(100);
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    );

    // ── Real API call ──
    // await api.put(`/notifications/${id}/read`);
  },

  /** Mark all notifications as read */
  async markAllRead(): Promise<void> {
    await sleep(150);
    const now = new Date().toISOString();
    notifications = notifications.map((n) => ({ ...n, is_read: true, read_at: now }));

    // ── Real API call ──
    // await api.put('/notifications/read-all');
  },

  /** Delete a notification */
  async destroy(id: string): Promise<void> {
    await sleep(100);
    notifications = notifications.filter((n) => n.id !== id);

    // ── Real API call ──
    // await api.delete(`/notifications/${id}`);
  },

  /** Get unread count */
  async getUnreadCount(): Promise<number> {
    await sleep(100);
    return notifications.filter((n) => !n.is_read).length;

    // ── Real API call ──
    // const res = await api.get<ApiResponse<{ count: number }>>('/notifications?unread_only=1');
    // return res.data.data.count;
  },
};

