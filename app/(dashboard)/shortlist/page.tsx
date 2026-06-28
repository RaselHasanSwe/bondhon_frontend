'use client';

import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {shortlistService} from '@/services/profileService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
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
            showSuccessToast('Removed from shortlist');
        },
        onError: (error: any) => {
            const message = getErrorMessage(error);
            showErrorToast(message);
        },
    });

    const paginatedData = data?.data as { data?: ShortlistItem[]; total?: number; last_page?: number } | undefined;
    const items: ShortlistItem[] = paginatedData?.data ?? [];
    const lastPage = paginatedData?.last_page ?? 1;
    const total = paginatedData?.total ?? 0;

    return (
        <div className="max-w-6xl mx-auto pb-20 md:pb-6">
            <div className="mb-6 flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <StarFilledIcon size={22} className="text-[var(--primary)]"/> Shortlist
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} profile{total !== 1 ? 's' : ''} shortlisted</p>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="skeleton-gold aspect-[3/4]"/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="card-premium p-12 text-center">
                    <p className="text-destructive">Failed to load shortlist.</p>
                </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <StarIcon size={56} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Your shortlist is empty</p>
                    <p className="text-sm text-muted-foreground mt-2">Star profiles you like to save them here</p>
                </div>
            )}

            {!isLoading && items.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
                        {items.map((item) => (
                            <div key={item.id} className="relative">
                                <MatchCard profile={item.user} showScore={false}/>
                                <button
                                    onClick={() => removeMutation.mutate(item.user.id)}
                                    className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full p-1.5 text-destructive hover:bg-red-50 transition-colors shadow-sm"
                                    title="Remove from shortlist"
                                >
                                    <XIcon size={12} strokeWidth={2.5}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {lastPage > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-page">
                                <ArrowLeftIcon size={14} strokeWidth={2}/> Previous
                            </button>
                            <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="btn-page">
                                Next <ArrowRightIcon size={14} strokeWidth={2}/>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

