'use client';

import {matchService} from '@/services/profileService';
import {MatchCard} from '@/components/match/MatchCard';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizeMetaPage} from '@/lib/pagination';
import {HeartIcon} from '@/components/ui/icons';

export default function MatchesPage() {
    const {
        items: matches,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList({
        queryKey: ['matches'],
        queryFn: (page) =>
            matchService.getMatches(page).then((r) => normalizeMetaPage(r.data.data, page)),
    });

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

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={matches.length > 0}
                        endMessage="You've seen all matches"
                    />
                </>
            )}
        </div>
    );
}
