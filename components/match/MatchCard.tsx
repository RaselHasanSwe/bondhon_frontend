'use client';

import React, {useState, useEffect} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {formatAge, formatHeight, resolvePhotoUrl} from '@/lib/utils';
import {CompatibilityScore} from './CompatibilityScore';
import {interestService, shortlistService} from '@/services/profileService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import type {ProfileCard} from '@/types/profile';
import {MapPinIcon, ReligionIcon, GraduationCapIcon, MailIcon, StarIcon, StarFilledIcon, UserIcon, CheckIcon} from '@/components/ui/icons';

interface MatchCardProps {
    profile: ProfileCard;
    score?: number;
    showScore?: boolean;
}

export function MatchCard({profile, score, showScore = true}: MatchCardProps) {
    const queryClient = useQueryClient();
    const [interestStatus, setInterestStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [shortlisted, setShortlisted] = useState(false);

    // Fetch interest status
    const {data: interestStatusRes} = useQuery({
        queryKey: ['interests-status-card', profile.id],
        queryFn: () => interestService.checkStatus(profile.id).then((r) => r.data.data),
    });

    // Fetch shortlist status
    const shortlistStatusQuery = useQuery({
        queryKey: ['shortlist-status-card', profile.id],
        queryFn: async () => {
            try {
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const response = await shortlistService.getAll(page);
                    const data = response.data?.data as any;
                    const profiles = data?.data ?? [];

                    const isShortlisted = profiles.some((s: any) => s.user?.id === profile.id);
                    if (isShortlisted) {
                        return true;
                    }

                    const lastPage = data?.last_page ?? 1;
                    const currentPage = data?.current_page ?? 1;
                    hasMore = currentPage < lastPage;
                    page++;

                    if (page > 100) hasMore = false;
                }

                return false;
            } catch (error) {
                console.error('Error checking shortlist status:', error);
                return false;
            }
        },
        staleTime: 0,
    });

    // Update interest status
    useEffect(() => {
        if (interestStatusRes) {
            setInterestStatus(interestStatusRes.status as 'none' | 'pending' | 'accepted');
        }
    }, [interestStatusRes]);

    // Update shortlist status
    useEffect(() => {
        if (shortlistStatusQuery.data !== undefined) {
            setShortlisted(shortlistStatusQuery.data);
        }
    }, [shortlistStatusQuery.data]);

    const sendInterestMutation = useMutation({
        mutationFn: (id: number) => interestService.send(id),
        onSuccess: () => {
            setInterestStatus('pending');
            queryClient.invalidateQueries({queryKey: ['interests-status-card']});
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: any) => {
            const message = getErrorMessage(error);
            showErrorToast(message);
        },
    });

     const shortlistMutation = useMutation({
         mutationFn: (id: number) => shortlistService.toggle(id),
         onSuccess: async () => {
             setShortlisted((s) => !s);
             queryClient.invalidateQueries({queryKey: ['shortlist-status-card'], exact: false});
             queryClient.invalidateQueries({queryKey: ['shortlist'], exact: false});
             await shortlistStatusQuery.refetch();
             showSuccessToast(shortlisted ? 'Removed from shortlist' : 'Added to shortlist');
         },
         onError: (error: any) => {
             const message = getErrorMessage(error);
             showErrorToast(message);
         },
     });

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : `/profile/${profile.id}`;

    const handleSendInterest = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (sendInterestMutation.isPending || interestStatus !== 'none') return;
        sendInterestMutation.mutate(profile.id);
    };

    const handleShortlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (shortlistMutation.isPending) return;
        shortlistMutation.mutate(profile.id);
    };

    return (
        <div
            className="card-premium overflow-hidden group animate-fade-in flex flex-col h-full">
            {/* Photo */}
            <Link href={profileUrl} className="block relative aspect-[4/5] bg-[var(--gold-50)]">
                {resolvePhotoUrl(profile.primary_photo) ? (
                    <img
                        src={resolvePhotoUrl(profile.primary_photo)!}
                        className="w-full h-full object-cover"
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
            <div className="p-4 flex flex-col h-full">
                {/* Profile Content - Takes up space */}
                <div>
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
                </div>

                {/* Actions - Bottom Aligned */}
                <div className="mt-auto pt-4 flex items-center gap-2">
                    <button
                        onClick={handleSendInterest}
                        disabled={interestStatus !== 'none' || sendInterestMutation.isPending}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            interestStatus === 'accepted'
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : interestStatus === 'pending'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : 'btn-gold'
                        }`}
                        style={{height:'auto', padding:'0.5rem', borderRadius:'0.75rem'}}
                    >
                        {interestStatus === 'accepted'
                            ? <><CheckIcon size={12} strokeWidth={2.5}/> Approved</>
                            : interestStatus === 'pending'
                                ? <><CheckIcon size={12} strokeWidth={2.5}/> Interest Sent</>
                                : <><MailIcon size={12} strokeWidth={2}/> Send Interest</>
                        }
                    </button>
                    <button
                        onClick={handleShortlist}
                        disabled={shortlistMutation.isPending}
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

