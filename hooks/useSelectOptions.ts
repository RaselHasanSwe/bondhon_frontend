import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/** Canonical option type for all dynamic select fields (matches API response). */
export type OptionItem = {
    id: number;
    value: string;
    label: string;
    metadata?: Record<string, unknown>;
};

/** @deprecated Use OptionItem */
export type DynamicOption = OptionItem;

const STALE_MS = 1000 * 60 * 60; // 1 hour — options rarely change

/**
 * Fetch flat / top-level options for a group.
 * e.g. useOptions('religion'), useOptions('marital_status')
 */
export function useOptions(group: string) {
    return useQuery<OptionItem[]>({
        queryKey: ['options', group],
        queryFn: () =>
            api.get(`/options/${group}`).then((r) => r.data),
        staleTime: STALE_MS,
        placeholderData: [],
    });
}

/**
 * Fetch child options that depend on a parent row id.
 * e.g. caste depends on selected religion id,
 *      country depends on selected country id for level-2 locations,
 *      country depends on selected state/division id for level-3 locations.
 *
 * Only fires when parentId is truthy.
 */
export function useChildOptions(
    group: string,
    parentId: number | null | undefined,
) {
    return useQuery<OptionItem[]>({
        queryKey: ['options', group, parentId],
        queryFn: () =>
            api
                .get(`/options/${group}`, { params: { parent_id: parentId } })
                .then((r) => r.data),
        enabled: !!parentId,
        staleTime: STALE_MS,
        placeholderData: [],
    });
}

