'use client';

import {useUserQuery} from '@/hooks/useUserQuery';
import {profileService, matchService, interestService, profileViewService} from '@/services/profileService';
import {ProfileCompletionBar} from '@/components/profile/ProfileCompletionBar';
import {MatchCard} from '@/components/match/MatchCard';
import {useAuthStore} from '@/store/authStore';
import Link from 'next/link';
import type {MatchScore} from '@/types/match';
import {MailIcon, EyeIcon, HeartIcon, CrownIcon, MatchesIcon} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

// ── Main Dashboard Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);

    const {data: completionData} = useUserQuery({
        queryKey: ['profile-completion'],
        queryFn: () => profileService.getCompletionStatus().then((r) => r.data.data),
    });

    const {data: matchesData} = useUserQuery({
        queryKey: ['matches', 1],
        queryFn: () => matchService.getMatches(1).then((r) => r.data),
    });

    const {data: interestsData} = useUserQuery({
        queryKey: ['interests-received', 1],
        queryFn: () => interestService.getReceived(1).then((r) => r.data),
    });

    const {data: viewersData} = useUserQuery({
        queryKey: ['profile-views', 1],
        queryFn: () => profileViewService.getMyViewers(1).then((r) => r.data),
    });

    const matches: MatchScore[] = (matchesData?.data as { data?: MatchScore[] })?.data ?? [];
    const pendingInterests = (interestsData?.data?.meta as { total?: number })?.total ?? 0;
    const totalViewers = (viewersData?.data?.meta as { total?: number })?.total ?? 0;
    const yourMatch = matches.length;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            {/* Header */}
            <div className="animate-fade-in-up">
                <h1 className="page-title flex items-center gap-2">
                    {greeting()}, <span className="text-gold-gradient">{user?.name?.split(' ')[0]}</span>!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Here&apos;s what&apos;s happening in your matrimony
                    journey</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
                {([
                    {
                        label: 'Pending Interests',
                        value: pendingInterests,
                        Icon: MailIcon,
                        href: '/interests',
                        color: 'text-[var(--primary)]',
                        iconBg: 'bg-[var(--gold-50)]',
                        iconColor: 'text-[var(--primary)]',
                    },
                    {
                        label: 'Profile Viewers',
                        value: totalViewers,
                        Icon: EyeIcon,
                        href: '/profile-views',
                        color: 'text-blue-500',
                        iconBg: 'bg-blue-50',
                        iconColor: 'text-blue-400',
                    },
                    {
                        label: 'Your Matches',
                        value: yourMatch,
                        Icon: HeartIcon,
                        href: '/matches',
                        color: 'text-pink-500',
                        iconBg: 'bg-pink-50',
                        iconColor: 'text-pink-400',
                    },
                    {
                        label: 'Plan',
                        value: user?.subscription_plan ?? 'free',
                        Icon: CrownIcon,
                        href: '/subscription',
                        color: 'text-purple-500',
                        iconBg: 'bg-purple-50',
                        iconColor: 'text-purple-400',
                    },
                ] as { label: string; value: string | number; Icon: ComponentType<IconProps>; href: string; color: string; iconBg: string; iconColor: string }[]).map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <div className="stat-card p-4 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                                    <stat.Icon size={20} strokeWidth={1.6} className={stat.iconColor}/>
                                </div>
                            </div>
                            <p className={`text-2xl font-bold capitalize ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Profile completion */}
            {completionData && <ProfileCompletionBar status={completionData}/>}

            {/* Today's matches */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Today&apos;s Matches</h2>
                    <Link href="/matches" className="text-sm text-[var(--primary)] hover:text-[var(--gold-600)] font-medium transition-colors flex items-center gap-1">
                        View all →
                    </Link>
                </div>

                {matches.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
                        {matches.slice(0, 6).map((match) => (
                            <MatchCard
                                key={match.id}
                                profile={match.candidate}
                                score={match.score}
                                showScore={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="card-premium p-12 text-center animate-fade-in-up">
                        <MatchesIcon size={56} className="mx-auto text-[var(--gold-200)] mb-3" strokeWidth={1.2}/>
                        <p className="text-foreground font-semibold" style={{fontFamily:'var(--font-heading)'}}>No matches yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Complete your profile to get personalized matches
                        </p>
                        <Link
                            href="/profile/edit"
                            className="btn-gold mt-4 inline-flex items-center justify-center text-sm"
                            style={{height:'2.5rem', borderRadius:'0.75rem', padding:'0 1.25rem'}}
                        >
                            Complete Profile
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
