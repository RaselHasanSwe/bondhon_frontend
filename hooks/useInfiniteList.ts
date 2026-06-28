'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { NormalizedPage } from '@/lib/pagination';

interface UseInfiniteListOptions<T> {
    queryKey: unknown[];
    queryFn: (page: number) => Promise<NormalizedPage<T>>;
    enabled?: boolean;
    retry?: boolean | number;
}

export function useInfiniteList<T>({
    queryKey,
    queryFn,
    enabled = true,
    retry = true,
}: UseInfiniteListOptions<T>) {
    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => queryFn(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
        enabled,
        retry,
    });

    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    const total = query.data?.pages[0]?.total ?? 0;

    return {
        ...query,
        items,
        total,
    };
}
