'use client';

import { useQuery } from '@tanstack/react-query';
import { profileService, matchService, interestService, profileViewService } from '@/services/profileService';
import { ProfileCompletionBar } from '@/components/profile/ProfileCompletionBar';
import { MatchCard } from '@/components/match/MatchCard';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import type { MatchScore } from '@/types/match';

// ── Main Dashboard Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: completionData } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: () => profileService.getCompletionStatus().then((r) => r.data.data),
  });

  const { data: matchesData } = useQuery({
    queryKey: ['matches', 1],
    queryFn: () => matchService.getMatches(1).then((r) => r.data),
  });

  const { data: interestsData } = useQuery({
    queryKey: ['interests-received', 1],
    queryFn: () => interestService.getReceived(1).then((r) => r.data),
  });

  const { data: viewersData } = useQuery({
    queryKey: ['profile-views', 1],
    queryFn: () => profileViewService.getMyViewers(1).then((r) => r.data),
  });

  const matches: MatchScore[] = (matchesData?.data as { data?: MatchScore[] })?.data ?? [];
  const pendingInterests = (interestsData?.data as { total?: number })?.total ?? 0;
  const totalViewers = (viewersData?.data as { total?: number })?.total ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">
          {greeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening in your matrimony journey</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Interests', value: pendingInterests, icon: '💌', href: '/interests', color: 'text-[#C9A227]' },
          { label: 'Profile Viewers', value: totalViewers, icon: '👀', href: '/profile-views', color: 'text-blue-500' },
          { label: 'Your Matches', value: (matchesData?.data as { total?: number })?.total ?? 0, icon: '💑', href: '/matches', color: 'text-pink-500' },
          { label: 'Plan', value: user?.subscription_plan ?? 'free', icon: '✨', href: '/subscription', color: 'text-purple-500' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#C9A227]/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-xl font-bold capitalize ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Profile completion */}
      {completionData && <ProfileCompletionBar status={completionData} />}

      {/* Today's matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1F2937]">Today&apos;s Matches</h2>
          <Link href="/matches" className="text-sm text-[#C9A227] hover:underline font-medium">
            View all →
          </Link>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">💑</p>
            <p className="text-gray-500 font-medium">No matches yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Complete your profile to get personalized matches
            </p>
            <Link
              href="/profile/edit"
              className="mt-4 inline-block bg-[#C9A227] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#b8911f] transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
