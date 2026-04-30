export type NotificationType =
  | 'interest_received'
  | 'interest_accepted'
  | 'profile_viewed'
  | 'new_message'
  | 'match_suggestion'
  | 'subscription_expiring'
  | 'photo_approved'
  | 'photo_rejected'
  | 'interest_expired'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Route to navigate to when notification is clicked */
  action_url: string | null;
  /** Small avatar / icon URL for the notification */
  avatar: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  /** Optional extra metadata */
  meta?: Record<string, unknown>;
}

