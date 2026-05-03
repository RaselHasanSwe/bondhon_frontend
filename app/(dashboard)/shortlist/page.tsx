'use client';

import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {shortlistService} from '@/services/profileService';
import {MatchCard} from '@/components/match/MatchCard';
import type {ProfileCard} from '@/types/profile';
import {StarFilledIcon, StarIcon, XIcon, ArrowLeftIcon, ArrowRightIcon} from '@/components/ui/icons';

interface ShortlistItem {
    id: number;
    created_at: string;
    user: ProfileCard;
}

export default function ShortlistPage() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const {data, isLoading, isError} = useQuery({
        queryKey: ['shortlist', page],
        queryFn: () => shortlistService.getAll(page).then((r) => r.data),
    });

    const removeMutation = useMutation({
        mutationFn: (userId: number) => shortlistService.toggle(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['shortlist']});
        },
    });

    const paginatedData = data?.data as { data?: ShortlistItem[]; total?: number; last_page?: number } | undefined;
    const items: ShortlistItem[] = paginatedData?.data ?? [];
    const lastPage = paginatedData?.last_page ?? 1;
    const total = paginatedData?.total ?? 0;

    return (
        <div className="max-w-6xl mx-auto pb-20 md:pb-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
                        <StarFilledIcon size={22} className="text-[#C9A227]"/> Shortlist
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{total} profile{total !== 1 ? 's' : ''} shortlisted</p>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse"/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
                    <p className="text-red-500">Failed to load shortlist.</p>
                </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <StarIcon size={56} className="mx-auto text-gray-200 mb-4" strokeWidth={1.2}/>
                    <p className="text-lg font-semibold text-gray-700">Your shortlist is empty</p>
                    <p className="text-sm text-gray-400 mt-2">Star profiles you like to save them here</p>
                </div>
            )}

            {!isLoading && items.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="relative">
                                <MatchCard profile={item.user} showScore={false}/>
                                <button
                                    onClick={() => removeMutation.mutate(item.user.id)}
                                    className="absolute top-2 left-2 bg-white/90 rounded-full p-1.5 text-red-500 hover:bg-red-50 transition-colors shadow"
                                    title="Remove from shortlist"
                                >
                                    <XIcon size={12} strokeWidth={2.5}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {lastPage > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 transition-colors flex items-center gap-1.5">
                            <ArrowLeftIcon size={14} strokeWidth={2}/> Previous
                        </button>
                        <span className="text-sm text-gray-500">Page {page} of {lastPage}</span>
                        <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#C9A227] hover:text-[#C9A227] disabled:opacity-40 transition-colors flex items-center gap-1.5">
                            Next <ArrowRightIcon size={14} strokeWidth={2}/>
                        </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

