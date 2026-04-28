import type { ProfileCard } from './profile';

export interface ScoreBreakdown {
  religion: number;
  age: number;
  location: number;
  education: number;
  income: number;
  marital_status: number;
  diet: number;
  height: number;
  lifestyle: number;
}

export interface MatchScore {
  id: number;
  score: number;
  score_breakdown: ScoreBreakdown;
  calculated_at: string;
  candidate: ProfileCard;
}

export interface SearchFilters {
  gender?: 'male' | 'female';
  age_min?: number;
  age_max?: number;
  religion?: string;
  caste?: string;
  marital_status?: string;
  height_min?: number;
  height_max?: number;
  education?: string;
  profession?: string;
  income_min?: number;
  income_max?: number;
  country?: string;
  city?: string;
  diet?: string;
  profile_id?: string;
  query?: string;
  page?: number;
}

