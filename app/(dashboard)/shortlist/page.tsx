'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {invalidateShortlistQueries} from '@/lib/cacheInvalidation';
import {shortlistService} from '@/services/profileService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {MatchCard} from '@/components/match/MatchCard';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizeFlatPage} from '@/lib/pagination';
import type {ProfileCard} from '@/types/profile';
import {StarFilledIcon, StarIcon, XIcon} from '@/components/ui/icons';

interface ShortlistItem {
    id: number;
    created_at: string;
    user: ProfileCard;
}

export default function ShortlistPage() {
    const queryClient = useQueryClient();

    const {
        items,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<ShortlistItem>({
        queryKey: ['shortlist'],
        queryFn: (page) =>
            shortlistService.getAll(page).then((r) => normalizeFlatPage(r.data.data, page)),
    });

    const removeMutation = useMutation({
        mutationFn: (userId: number) => shortlistService.toggle(userId),
        onSuccess: () => {
            invalidateShortlistQueries(queryClient);
            showSuccessToast('Removed from shortlist');
        },
        onError: (error: unknown) => {
            showErrorToast(getErrorMessage(error));
        },
    });

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

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={items.length > 0}
                        endMessage="You've seen all shortlisted profiles"
                    />
                </>
            )}
        </div>
    );
}
