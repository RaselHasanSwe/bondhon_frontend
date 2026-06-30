import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types/user';
import type { SearchFilters } from '@/types/match';
import type { PublicProfileCard } from '@/types/publicProfile';

const publicApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export type PublicSearchFilters = Omit<SearchFilters, 'profile_id'>;

export const publicSearchService = {
    search: (filters: PublicSearchFilters) =>
        publicApi.get<ApiResponse<PaginatedResponse<PublicProfileCard>>>('/public/profiles/search', {
            params: filters,
        }),
};
