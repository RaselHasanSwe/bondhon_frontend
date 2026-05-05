'use client';

import {useCallback, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useNotificationStore} from '@/store/notificationStore';
import {notificationService} from '@/services/notificationService';
import type {PaginatedNotifications} from '@/services/notificationService';
import type {AppNotification} from '@/types/notification';
import {cn} from '@/lib/utils';
import {
    BellIcon, MailIcon, CelebrationIcon, ClockIcon, EyeIcon,
    MessageSquareIcon, HeartIcon, AlertTriangleIcon, CheckCircleIcon,
    XCircleIcon, MegaphoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

const PER_PAGE = 15;

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
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
    broadcast_message: MegaphoneIcon,
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
    broadcast_message: 'bg-amber-50 border-amber-100',
};

export default function NotificationsPage() {
    const router = useRouter();
    const {unreadCount, markRead, markAllRead, remove} = useNotificationStore();

    const [tab, setTab] = useState<'all' | 'unread'>('all');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<PaginatedNotifications | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async (pg: number, unreadOnly: boolean) => {
        setIsLoading(true);
        try {
            const data = await notificationService.getPaginated(pg, PER_PAGE, unreadOnly);
            setResult(data);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        load(1, tab === 'unread');
    }, [tab, load]);

    useEffect(() => {
        load(page, tab === 'unread');
    }, [page, tab, load]);

    const handleTabChange = (next: 'all' | 'unread') => {
        if (next !== tab) {
            setTab(next);
        }
    };

    const handleClick = async (n: AppNotification) => {
        if (!n.is_read) {
            await markRead(n.id);
            // Optimistically update local result
            setResult((prev) => prev ? {
                ...prev,
                items: prev.items.map((i) => i.id === n.id ? {...i, is_read: true} : i),
                unreadCount: Math.max(0, prev.unreadCount - 1),
            } : prev);
        }
        router.push(`/notifications/${n.id}`);
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
        setResult((prev) => prev ? {
            ...prev,
            items: prev.items.map((i) => ({...i, is_read: true})),
            unreadCount: 0,
        } : prev);
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await remove(id);
        // Reload current page
        load(page, tab === 'unread');
    };

    const pagination = result?.pagination;
    const items = result?.items ?? [];
    const totalPages = pagination?.last_page ?? 1;

    // Build page number list (max 5 around current)
    const pageNumbers: (number | '…')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (page > 3) pageNumbers.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNumbers.push(i);
        if (page < totalPages - 2) pageNumbers.push('…');
        pageNumbers.push(totalPages);
    }

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 animate-fade-in-up">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        Notifications
                        <BellIcon size={22} className="text-primary"/>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pagination
                            ? `${pagination.total} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`
                            : 'Loading…'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-primary font-semibold hover:opacity-75 transition-opacity"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-muted/40 p-1 rounded-xl w-fit animate-fade-in-up">
                {(['all', 'unread'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTabChange(t)}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                            tab === t
                                ? 'bg-card shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                    </button>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="skeleton-gold h-20 rounded-2xl"/>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="card-premium py-16 text-center animate-fade-in-up">
                    <BellIcon size={48} className="mx-auto text-muted-foreground/30 mb-3"/>
                    <p className="text-lg font-semibold text-foreground">
                        {tab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {tab === 'unread'
                            ? 'You have no unread notifications.'
                            : 'You\'ll see activity here when something happens.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((n) => {
                        const NIcon = TYPE_ICONS[n.type] ?? MegaphoneIcon;
                        const colorClass = TYPE_COLORS[n.type] ?? 'bg-gray-50 border-gray-100';
                        return (
                            <div
                                key={n.id}
                                className={cn(
                                    'group relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md',
                                    !n.is_read ? 'bg-accent border-primary/20' : colorClass
                                )}
                                onClick={() => handleClick(n)}
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                                    <NIcon size={18} strokeWidth={1.8} className="text-muted-foreground"/>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            'text-sm text-foreground leading-snug',
                                            !n.is_read ? 'font-bold' : 'font-semibold'
                                        )}>
                                            {n.title}
                                        </p>
                                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                                            {formatRelativeTime(n.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                        {n.body}
                                    </p>
                                    <p className="text-[11px] text-primary mt-1.5 font-medium">
                                        Tap to open →
                                    </p>
                                </div>

                                {/* Unread dot */}
                                {!n.is_read && (
                                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"/>
                                )}

                                {/* Delete */}
                                {/*<button*/}
                                {/*    onClick={(e) => handleRemove(e, n.id)}*/}
                                {/*    className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"*/}
                                {/*    aria-label="Delete"*/}
                                {/*>*/}
                                {/*    <XIcon size={14} strokeWidth={2}/>*/}
                                {/*</button>*/}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 animate-fade-in-up">
                    <p className="text-xs text-muted-foreground">
                        Page {pagination?.current_page} of {totalPages}
                        {pagination && ` · ${pagination.total} total`}
                    </p>
                    <div className="flex items-center gap-1">
                        {/* Prev */}
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeftIcon size={14}/>
                        </button>

                        {/* Page numbers */}
                        {pageNumbers.map((p, i) =>
                            p === '…' ? (
                                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => setPage(p as number)}
                                    className={cn(
                                        'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                                        page === p
                                            ? 'bg-primary text-white'
                                            : 'border border-border text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    {p}
                                </button>
                            )
                        )}

                        {/* Next */}
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRightIcon size={14}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
