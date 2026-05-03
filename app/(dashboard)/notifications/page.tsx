'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useNotificationStore} from '@/store/notificationStore';
import type {AppNotification} from '@/types/notification';
import {cn} from '@/lib/utils';

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
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

const TYPE_COLORS: Record<AppNotification['type'], string> = {
    interest_received: 'bg-pink-50 border-pink-100',
    interest_accepted: 'bg-green-50 border-green-100',
    interest_expired: 'bg-gray-50 border-gray-100',
    profile_viewed: 'bg-blue-50 border-blue-100',
    new_message: 'bg-indigo-50 border-indigo-100',
    match_suggestion: 'bg-purple-50 border-purple-100',
    match_digest: 'bg-purple-50 border-purple-100',
    subscription_expiring: 'bg-yellow-50 border-yellow-100',
    subscription_expiry: 'bg-yellow-50 border-yellow-100',
    photo_approved: 'bg-green-50 border-green-100',
    photo_rejected: 'bg-red-50 border-red-100',
    system: 'bg-gray-50 border-gray-100',
};

export default function NotificationsPage() {
    const router = useRouter();
    const {notifications, unreadCount, isLoading, fetchNotifications, markRead, markAllRead, remove} =
        useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleClick = async (n: AppNotification) => {
        if (!n.is_read) await markRead(n.id);
        if (n.action_url) router.push(n.action_url);
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937]">Notifications 🔔</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllRead()}
                        className="text-sm text-[#C9A227] font-semibold hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}
                             className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"/>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-3/4"/>
                                <div className="h-2.5 bg-gray-200 rounded w-full"/>
                                <div className="h-2 bg-gray-200 rounded w-1/4"/>
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                    <p className="text-4xl mb-3">🔔</p>
                    <p className="text-lg font-semibold text-gray-700">No notifications yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                        You&apos;ll see activity here when something happens
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                'relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm',
                                !n.is_read ? 'bg-[#FBF6E8] border-[#C9A227]/20' : TYPE_COLORS[n.type]
                            )}
                            onClick={() => handleClick(n)}
                        >
                            {/* Icon */}
                            <div
                                className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                                {TYPE_ICONS[n.type]}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p
                                        className={cn(
                                            'text-sm text-[#1F2937] leading-snug',
                                            !n.is_read ? 'font-bold' : 'font-semibold'
                                        )}
                                    >
                                        {n.title}
                                    </p>
                                    <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                    {formatRelativeTime(n.created_at)}
                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                                {n.action_url && (
                                    <p className="text-[11px] text-[#C9A227] mt-1.5 font-medium">
                                        Tap to view →
                                    </p>
                                )}
                            </div>

                            {/* Unread dot */}
                            {!n.is_read && (
                                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C9A227]"/>
                            )}

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    remove(n.id);
                                }}
                                className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity p-1"
                                aria-label="Delete notification"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

