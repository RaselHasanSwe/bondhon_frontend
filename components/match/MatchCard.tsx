'use client';

import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {formatAge, formatHeight, resolvePhotoUrl} from '@/lib/utils';
import {CompatibilityScore} from './CompatibilityScore';
import {interestService, shortlistService} from '@/services/profileService';
import type {ProfileCard} from '@/types/profile';
import {MapPinIcon, ReligionIcon, GraduationCapIcon, MailIcon, StarIcon, StarFilledIcon, UserIcon, CheckIcon} from '@/components/ui/icons';

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
            className="card-premium overflow-hidden group animate-fade-in">
            {/* Photo */}
            <Link href={profileUrl} className="block relative aspect-[4/5] bg-[var(--gold-50)]">
                {resolvePhotoUrl(profile.primary_photo) ? (
                    <Image
                        src={resolvePhotoUrl(profile.primary_photo)!}
                        alt={`${profile.name}'s photo`}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <UserIcon size={48} className="text-[var(--gold-200)]" strokeWidth={1.2}/>
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
                        className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-green-600 font-medium flex items-center gap-1 shadow-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified
                    </div>
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            </Link>

            {/* Info */}
            <div className="p-4">
                <Link href={profileUrl}>
                    <h3 className="font-semibold text-foreground truncate hover:text-[var(--primary)] transition-colors" style={{fontFamily:'var(--font-heading)'}}>
                        {profile.name}
                    </h3>
                </Link>

                <div className="mt-1 space-y-0.5">
                    <p className="text-sm text-muted-foreground">
                        {formatAge(profile.profile?.dob)} •{' '}
                        {formatHeight(profile.profile?.height_cm)}
                    </p>
                    {profile.profile?.city && (
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1 truncate">
                            <MapPinIcon size={12} strokeWidth={1.8}/>
                            {profile.profile.city}{profile.profile.country ? `, ${profile.profile.country}` : ''}
                        </p>
                    )}
                    {profile.religion && (
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <ReligionIcon size={12} strokeWidth={1.8}/>
                            {profile.religion}
                        </p>
                    )}
                    {profile.education && (
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <GraduationCapIcon size={12} strokeWidth={1.8}/>
                            {profile.education}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                    <button
                        onClick={handleSendInterest}
                        disabled={loading || interestSent}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            interestSent
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'btn-gold'
                        }`}
                        style={interestSent ? {} : {height:'auto', padding:'0.5rem', borderRadius:'0.75rem'}}
                    >
                        {interestSent
                            ? <><CheckIcon size={12} strokeWidth={2.5}/> Sent</>
                            : <><MailIcon size={12} strokeWidth={2}/> Interest</>
                        }
                    </button>
                    <button
                        onClick={handleShortlist}
                        disabled={loading}
                        title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                        className={`p-2 rounded-xl border transition-all ${
                            shortlisted
                                ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)]'
                                : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--accent)]'
                        }`}
                    >
                        {shortlisted
                            ? <StarFilledIcon size={16} strokeWidth={1.8}/>
                            : <StarIcon size={16} strokeWidth={1.8}/>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

