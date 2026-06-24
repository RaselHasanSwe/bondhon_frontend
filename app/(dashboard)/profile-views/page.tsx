// app/(dashboard)/profile-views/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileViewService } from '@/services/profileService';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
    EyeIcon,
    UserIcon,
    MapPinIcon,
    CrownIcon,
    CheckIcon,
    ArrowLeftIcon,
    MailIcon
} from '@/components/ui/icons';
import { cn, formatAge, resolvePhotoUrl, timeAgo } from '@/lib/utils';
import type { ProfileView } from '@/types/profile';

// Simple loading skeleton
function ViewerSkeleton() {
    return (
        <div className="card-premium p-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
        </div>
    );
}

export default function ProfileViewsPage() {
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);

    const { data, isLoading, error, isError } = useQuery({
        queryKey: ['profile-views', page],
        queryFn: () => profileViewService.getMyViewers(page).then((r) => r.data),
        retry: false,
    });

    const viewers = data?.data?.data ?? [];
    const meta = data?.data?.meta;
    const totalViewers = meta?.total ?? 0;
    const currentPage = meta?.current_page ?? 1;
    const lastPage = meta?.last_page ?? 1;

    // Check if error is due to subscription
    const isSubscriptionError = (error as any)?.response?.status === 403;
    const errorMessage = (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Failed to load profile viewers';

    // Handle pagination
    const goToPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= lastPage) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Get subscription plan display
    const getPlanBadge = (plan: string) => {
        const planMap: Record<string, { bg: string; text: string }> = {
            platinum: { bg: 'bg-purple-50', text: 'text-purple-600' },
            gold: { bg: 'bg-amber-50', text: 'text-amber-600' },
            silver: { bg: 'bg-gray-100', text: 'text-gray-600' },
            free: { bg: 'bg-gray-50', text: 'text-gray-400' },
        };
        return planMap[plan] || planMap.free;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeftIcon size={20} strokeWidth={1.8} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                <EyeIcon size={24} strokeWidth={1.8} className="text-[var(--primary)]" />
                                Profile Viewers
                            </h1>
                            {!isLoading && !isError && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {totalViewers} {totalViewers === 1 ? 'person has' : 'people have'} viewed your profile
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subscription badge */}
                {user?.subscription_plan && (
                    <div className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                        user.subscription_plan === 'platinum' && 'bg-purple-50 border-purple-100',
                        user.subscription_plan === 'gold' && 'bg-amber-50 border-amber-100',
                        user.subscription_plan === 'silver' && 'bg-gray-50 border-gray-200',
                        user.subscription_plan === 'free' && 'bg-gray-50 border-gray-200',
                    )}>
                        <CrownIcon size={14} strokeWidth={2} className={cn(
                            user.subscription_plan === 'platinum' && 'text-purple-500',
                            user.subscription_plan === 'gold' && 'text-amber-500',
                            user.subscription_plan === 'silver' && 'text-gray-500',
                            user.subscription_plan === 'free' && 'text-gray-400',
                        )} />
                        <span className={cn(
                            'text-xs font-medium capitalize',
                            user.subscription_plan === 'platinum' && 'text-purple-600',
                            user.subscription_plan === 'gold' && 'text-amber-600',
                            user.subscription_plan === 'silver' && 'text-gray-600',
                            user.subscription_plan === 'free' && 'text-gray-400',
                        )}>
                            {user.subscription_plan}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <ViewerSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="card-premium p-12 text-center animate-fade-in-up">
                    {isSubscriptionError ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                <CrownIcon size={40} strokeWidth={1.5} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                Upgrade to See Who Viewed You
                            </h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {errorMessage || 'Viewing your profile visitors requires an upgraded subscription plan.'}
                            </p>
                            <Link
                                href="/subscription"
                                className="btn-gold mt-6 inline-flex items-center justify-center text-sm"
                                style={{ height: '2.75rem', borderRadius: '0.75rem', padding: '0 1.75rem' }}
                            >
                                <CrownIcon size={16} strokeWidth={2} className="mr-2" />
                                View Plans
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <EyeIcon size={40} strokeWidth={1.5} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                Unable to Load Viewers
                            </h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {errorMessage}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-6 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            ) : viewers.length === 0 ? (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <div className="w-24 h-24 rounded-full bg-[var(--gold-50)] flex items-center justify-center mx-auto mb-4">
                        <EyeIcon size={48} strokeWidth={1.2} className="text-[var(--gold-200)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground"
                        style={{ fontFamily: 'var(--font-heading)' }}>
                        No Views Yet
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        Your profile hasn't been viewed by anyone yet.
                        Complete your profile to get more visibility.
                    </p>
                    <Link
                        href="/profile/edit"
                        className="btn-gold mt-6 inline-flex items-center justify-center text-sm"
                        style={{ height: '2.75rem', borderRadius: '0.75rem', padding: '0 1.75rem' }}
                    >
                        Complete Profile
                    </Link>
                </div>
            ) : (
                <>
                    {/* Viewers List */}
                    <div className="space-y-3 stagger">
                        {viewers.map((view: ProfileView) => (
                            <Link
                                key={view.viewer_id}
                                href={`/profile/${view.viewer.profile?.profile_id}`}
                                className="block"
                            >
                                <div className="card-premium p-4 hover:shadow-md transition-all duration-200 hover:border-[var(--primary)]/20 group">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full bg-[var(--gold-50)] flex-shrink-0 overflow-hidden border-2 border-transparent group-hover:border-[var(--primary)]/30 transition-colors">
                                            {resolvePhotoUrl(view.viewer.primary_photo) ? (
                                                <img
                                                    src={resolvePhotoUrl(view.viewer.primary_photo)!}
                                                    alt={view.viewer.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <UserIcon size={24} strokeWidth={1.5} className="text-[var(--gold-200)]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Viewer Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground truncate group-hover:text-[var(--primary)] transition-colors"
                                                    style={{ fontFamily: 'var(--font-heading)' }}>
                                                    {view.viewer.name}
                                                </h3>
                                                {view.viewer.profile?.is_verified && (
                                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                        <CheckIcon size={12} strokeWidth={2.5} />
                                                        Verified
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                                                {view.viewer.profile?.age !== null && view.viewer.profile?.age !== undefined && (
                                                    <span>{formatAge(view.viewer.profile.dob)}</span>
                                                )}
                                                {view.viewer.profile?.city && (
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPinIcon size={12} strokeWidth={1.8} />
                                                        {view.viewer.profile.city}
                                                        {view.viewer.profile.country && `, ${view.viewer.profile.country}`}
                                                    </span>
                                                )}
                                                {view.viewer.profile?.marital_status && (
                                                    <span className="capitalize">
                                                        {view.viewer.profile.marital_status.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                                {view.viewer.education && (
                                                    <span className="truncate max-w-[120px]">
                                                        {view.viewer.education}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Viewed At */}
                                        <div className="flex-shrink-0 text-right hidden sm:block">
                                            <div className="text-xs text-muted-foreground">
                                                {timeAgo(view.viewed_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile: Viewed At */}
                                    <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                                        <div className="text-xs text-muted-foreground">
                                            Viewed {timeAgo(view.viewed_at)}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-between gap-4 pt-4 animate-fade-in-up">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                                    currentPage === 1
                                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                )}
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {lastPage}
                                </span>
                            </div>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === lastPage}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                                    currentPage === lastPage
                                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                )}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}