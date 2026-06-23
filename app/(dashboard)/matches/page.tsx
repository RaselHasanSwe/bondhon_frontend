'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {matchService} from '@/services/profileService';
import {MatchCard} from '@/components/match/MatchCard';
import type {MatchScore} from '@/types/match';
import {HeartIcon, ArrowLeftIcon, ArrowRightIcon} from '@/components/ui/icons';

export default function MatchesPage() {
    const [page, setPage] = useState(1);

    const {data, isLoading, isError} = useQuery({
        queryKey: ['matches', page],
        queryFn: () => matchService.getMatches(page).then((r) => r.data),
    });

    const paginatedData = data?.data as { data?: MatchScore[]; total?: number; last_page?: number } | undefined;
    const matches = paginatedData?.data ?? [];
    const lastPage = paginatedData?.last_page ?? 1;
    const total = paginatedData?.total ?? 0;

    return (
        <div className="max-w-6xl mx-auto pb-20 md:pb-6">
            <div className="mb-6 flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="page-title">Your Matches</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Sorted by compatibility score • {total} matches found</p>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="skeleton-gold aspect-[3/4]"/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="card-premium p-12 text-center">
                    <p className="text-destructive">Failed to load matches. Please try again.</p>
                </div>
            )}

            {!isLoading && !isError && matches.length === 0 && (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <HeartIcon size={56} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>No matches yet</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        Match scores are calculated nightly. Complete your profile and preferences to see matches tomorrow.
                    </p>
                </div>
            )}

            {!isLoading && matches.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
                        {matches.map((match) => (
                            <MatchCard key={match.id} profile={match.candidate} score={match.score}/>
                        ))}
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                    className="btn-page">
                                <ArrowLeftIcon size={14} strokeWidth={2}/> Previous
                            </button>
                            <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                                    className="btn-page">
                                Next <ArrowRightIcon size={14} strokeWidth={2}/>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

