'use client';

import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {formatAge, formatHeight, resolvePhotoUrl} from '@/lib/utils';
import {CompatibilityScore} from './CompatibilityScore';
import {interestService, shortlistService} from '@/services/profileService';
import type {ProfileCard} from '@/types/profile';

interface MatchCardProps {
    profile: ProfileCard;
    score?: number;
    showScore?: boolean;
}

export function MatchCard({profile, score, showScore = true}: MatchCardProps) {
    const [interestSent, setInterestSent] = useState(false);
    const [shortlisted, setShortlisted] = useState(false);
    const [loading, setLoading] = useState(false);

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : `/profile/${profile.id}`;

    const handleSendInterest = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (loading || interestSent) return;
        setLoading(true);
        try {
            await interestService.send(profile.id);
            setInterestSent(true);
        } catch {
            // Silently fail — optimistic UI would show error toast in production
        } finally {
            setLoading(false);
        }
    };

    const handleShortlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            await shortlistService.toggle(profile.id);
            setShortlisted((s) => !s);
        } catch {
            // error handling
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
            {/* Photo */}
            <Link href={profileUrl} className="block relative aspect-[4/5] bg-gray-100">
                {resolvePhotoUrl(profile.primary_photo) ? (
                    <Image
                        src={resolvePhotoUrl(profile.primary_photo)!}
                        alt={`${profile.name}'s photo`}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                        {profile.gender === 'female' ? '👩' : '👨'}
                    </div>
                )}

                {/* Score badge */}
                {showScore && score !== undefined && (
                    <div className="absolute top-3 right-3">
                        <CompatibilityScore score={score} size="sm"/>
                    </div>
                )}

                {/* Verified badge */}
                {profile.profile?.is_verified && (
                    <div
                        className="absolute top-3 left-3 bg-white/90 rounded-full px-2 py-0.5 text-xs text-green-600 font-medium">
                        ✓ Verified
                    </div>
                )}
            </Link>

            {/* Info */}
            <div className="p-4">
                <Link href={profileUrl}>
                    <h3 className="font-semibold text-[#1F2937] truncate hover:text-[#C9A227] transition-colors">
                        {profile.name}
                    </h3>
                </Link>

                <div className="mt-1 space-y-0.5">
                    <p className="text-sm text-gray-500">
                        {formatAge(profile.profile?.dob)} •{' '}
                        {formatHeight(profile.profile?.height_cm)}
                    </p>
                    {profile.profile?.city && (
                        <p className="text-xs text-gray-400">📍 {profile.profile.city}{profile.profile.country ? `, ${profile.profile.country}` : ''}</p>
                    )}
                    {profile.religion && (
                        <p className="text-xs text-gray-400">🕌 {profile.religion}</p>
                    )}
                    {profile.education && (
                        <p className="text-xs text-gray-400">🎓 {profile.education}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                    <button
                        onClick={handleSendInterest}
                        disabled={loading || interestSent}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            interestSent
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-[#C9A227] hover:bg-[#b8911f] text-white'
                        }`}
                    >
                        {interestSent ? '✓ Sent' : '💌 Interest'}
                    </button>
                    <button
                        onClick={handleShortlist}
                        disabled={loading}
                        title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                        className={`p-2 rounded-xl border transition-colors ${
                            shortlisted
                                ? 'border-[#C9A227] text-[#C9A227] bg-[#FBF6E8]'
                                : 'border-gray-200 text-gray-400 hover:border-[#C9A227] hover:text-[#C9A227]'
                        }`}
                    >
                        ⭐
                    </button>
                </div>
            </div>
        </div>
    );
}

