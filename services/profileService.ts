import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/user';
import type { FullProfile, PartnerPreference } from '@/types/profile';
import type { MatchScore, SearchFilters } from '@/types/match';
import type { ProfileCard } from '@/types/profile';

export const profileService = {
  getMyProfile: () =>
    api.get<ApiResponse<FullProfile>>('/profile'),

  updateProfile: (data: Partial<FullProfile>) =>
    api.put<ApiResponse<FullProfile>>('/profile', data),

  getProfileById: (profileId: string) =>
    api.get<ApiResponse<FullProfile>>(`/profile/${profileId}`),

  updatePreferences: (data: Partial<PartnerPreference> | Record<string, unknown>) =>
    api.put<ApiResponse<PartnerPreference>>('/preferences', data),

  getCompletionStatus: () =>
    api.get<ApiResponse<{
      percentage: number;
      has_basic_info: boolean;
      has_religious_detail: boolean;
      has_family_detail: boolean;
      has_education: boolean;
      has_lifestyle: boolean;
      has_horoscope: boolean;
      has_preferences: boolean;
      has_photo: boolean;
      has_about_me: boolean;
    }>>('/profile/completion'),

  uploadPhoto: (file: File, isPrivate?: boolean) => {
    const form = new FormData();
    form.append('photo', file);
    if (isPrivate) form.append('is_private', '1');
    // Axios v1.x converts FormData to JSON when the instance default is
    // Content-Type: application/json (via internal FormDataToJSON).
    // Overriding transformRequest with a pass-through bypasses that conversion
    // and lets the browser send the FormData natively with the correct
    // multipart/form-data boundary in the Content-Type header.
    return api.post('/profile/photos', form, {
      transformRequest: [(data: FormData) => data],
    });
  },

  deletePhoto: (photoId: number) =>
    api.delete(`/profile/photos/${photoId}`),

  setPrimaryPhoto: (photoId: number) =>
    api.put(`/profile/photos/${photoId}/primary`),
};

export const matchService = {
  getMatches: (page = 1) =>
    api.get<ApiResponse<PaginatedResponse<MatchScore>>>('/matches', { params: { page } }),

  search: (filters: SearchFilters) =>
    api.get<ApiResponse<PaginatedResponse<ProfileCard>>>('/matches/search', { params: filters }),

  getCompatibilityScore: (userId: number) =>
    api.get<ApiResponse<{ score: number; score_breakdown: import('@/types/match').ScoreBreakdown; calculated_at: string }>>(`/matches/${userId}/score`),
};

export const interestService = {
  send: (receiverId: number) =>
    api.post('/interests', { receiver_id: receiverId }),

  getReceived: (page = 1) =>
    api.get('/interests/received', { params: { page } }),

  getSent: (page = 1) =>
    api.get('/interests/sent', { params: { page } }),

  accept: (id: number) =>
    api.put(`/interests/${id}/accept`),

  decline: (id: number) =>
    api.put(`/interests/${id}/decline`),

  ignore: (id: number) =>
    api.put(`/interests/${id}/ignore`),
};

export const shortlistService = {
  toggle: (userId: number) =>
    api.post(`/shortlist/${userId}`),

  getAll: (page = 1) =>
    api.get('/shortlist', { params: { page } }),
};

export const blockService = {
  block: (userId: number) =>
    api.post(`/block/${userId}`),

  unblock: (userId: number) =>
    api.delete(`/block/${userId}`),
};

export const reportService = {
  report: (data: { reported_id: number; reason: string; description?: string }) =>
    api.post('/report', data),
};

export const profileViewService = {
  getMyViewers: (page = 1) =>
    api.get('/profile-views', { params: { page } }),
};

