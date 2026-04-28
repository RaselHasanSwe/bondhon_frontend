import type { ProfileCard } from './profile';

export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'ignored' | 'expired';

export interface Interest {
  id: number;
  status: InterestStatus;
  expires_at: string;
  created_at: string;
  sender: ProfileCard | null;
  receiver: ProfileCard | null;
}

