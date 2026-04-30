'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import type { AppNotification } from '@/types/notification';
import type { BackendNotification } from '@/types/notification';
import { cn } from '@/lib/utils';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<AppNotification['type'], string> = {
  interest_received: '💌',
  interest_accepted: '🎉',
  interest_expired: '⌛',
  profile_viewed: '👀',
  new_message: '💬',
  match_suggestion: '💑',
  match_digest: '💑',
  subscription_expiring: '⚠️',
  subscription_expiry: '⚠️',
  photo_approved: '✅',
  photo_rejected: '❌',
  system: '📢',
};

export function NotificationBell() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead, addNotification } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notifications via Laravel Echo
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    import('@/lib/echo').then(({ getEcho }) => {
      const echo = getEcho();
      if (!echo) return;
      echo.private(`user.${user.id}`)
        .listen('.notification.created', (e: BackendNotification) => {
          addNotification(notificationService.transformNotification(e));
        });
      return () => { echo.leave(`user.${user.id}`); };
    });
  }, [user?.id, addNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    setOpen(false);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const preview = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1F2937]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[11px] text-[#C9A227] hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setOpen(false); router.push('/notifications'); }}
                className="text-[11px] text-gray-500 hover:text-[#1F2937]"
              >
                View all →
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {preview.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              preview.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                    !n.is_read && 'bg-[#FBF6E8]'
                  )}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold text-[#1F2937] leading-tight', !n.is_read && 'font-bold')}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#C9A227] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => { setOpen(false); router.push('/notifications'); }}
                className="text-xs text-[#C9A227] hover:underline font-medium"
              >
                See all {notifications.length} notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

