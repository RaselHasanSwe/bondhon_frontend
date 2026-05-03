'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {matchService} from '@/services/profileService';
import {MatchCard} from '@/components/match/MatchCard';
import type {MatchScore} from '@/types/match';

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
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937]">Your Matches</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Sorted by compatibility score • {total} matches
                        found</p>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: 8}).map((_, i) => (
                        <div key={i}
                             className="bg-white rounded-2xl border border-gray-100 aspect-[3/4] animate-pulse"/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
                    <p className="text-red-500">Failed to load matches. Please try again.</p>
                </div>
            )}

            {!isLoading && !isError && matches.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <p className="text-5xl mb-4">💭</p>
                    <p className="text-lg font-semibold text-gray-700">No matches yet</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                        Match scores are calculated nightly. Complete your profile and preferences to see matches
                        tomorrow.
                    </p>
                </div>
            )}

            {!isLoading && matches.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {matches.map((match) => (
                            <MatchCard key={match.id} profile={match.candidate} score={match.score}/>
                        ))}
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>
                            <span className="text-sm text-gray-500">
                Page {page} of {lastPage}
              </span>
                            <button
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

