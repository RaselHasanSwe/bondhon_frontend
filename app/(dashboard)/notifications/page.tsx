'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useNotificationStore} from '@/store/notificationStore';
import type {AppNotification} from '@/types/notification';
import {cn} from '@/lib/utils';
import {
    BellIcon, MailIcon, CelebrationIcon, ClockIcon, EyeIcon,
    MessageSquareIcon, HeartIcon, AlertTriangleIcon, CheckCircleIcon,
    XCircleIcon, MegaphoneIcon, XIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

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

const TYPE_ICONS: Record<AppNotification['type'], ComponentType<IconProps>> = {
    interest_received: MailIcon,
    interest_accepted: CelebrationIcon,
    interest_expired: ClockIcon,
    profile_viewed: EyeIcon,
    new_message: MessageSquareIcon,
    match_suggestion: HeartIcon,
    match_digest: HeartIcon,
    subscription_expiring: AlertTriangleIcon,
    subscription_expiry: AlertTriangleIcon,
    photo_approved: CheckCircleIcon,
    photo_rejected: XCircleIcon,
    system: MegaphoneIcon,
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
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        Notifications
                        <BellIcon size={22} className="text-primary"/>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllRead()}
                        className="text-sm text-primary font-semibold hover:text-[var(--gold-600)] transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton-gold h-20"/>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="card-premium py-16 text-center animate-fade-in-up">
                    <BellIcon size={48} className="mx-auto text-(--gold-200) mb-3"/>
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>No notifications yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        You&apos;ll see activity here when something happens
                    </p>
                </div>
            ) : (
                <div className="space-y-2 stagger">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                'relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-[var(--shadow-card-hover)]',
                                !n.is_read ? 'bg-[var(--accent)] border-[var(--primary)]/20' : TYPE_COLORS[n.type]
                            )}
                            onClick={() => handleClick(n)}
                        >
                            {/* Icon */}
                            <div
                                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
                                {(() => {
                                    const NIcon = TYPE_ICONS[n.type];
                                    return <NIcon size={18} strokeWidth={1.8} className="text-muted-foreground"/>;
                                })()}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p
                                        className={cn(
                                            'text-sm text-foreground leading-snug',
                                            !n.is_read ? 'font-bold' : 'font-semibold'
                                        )}
                                    >
                                        {n.title}
                                    </p>
                                    <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">
                        {formatRelativeTime(n.created_at)}
                      </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                                {n.action_url && (
                                    <p className="text-[11px] text-primary mt-1.5 font-medium">
                                        Tap to view →
                                    </p>
                                )}
                            </div>

                            {/* Unread dot */}
                            {!n.is_read && (
                                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse-gold"/>
                            )}

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    remove(n.id);
                                }}
                                className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                                aria-label="Delete notification"
                            >
                                <XIcon size={14} strokeWidth={2}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

