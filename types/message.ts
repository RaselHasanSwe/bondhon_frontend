export type MessageType = 'text' | 'image' | 'document' | 'voice';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: MessageType;
  body: string | null;
  file_path: string | null;
  is_deleted: boolean;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  /** Virtual: computed from delivered_at / read_at */
  status?: MessageStatus;
}

export interface ConversationParticipant {
  id: number;
  name: string;
  avatar: string | null;
  is_online: boolean;
  last_seen_at: string | null;
  profile_id: string;
  subscription_plan: 'free' | 'silver' | 'gold' | 'platinum';
}

export interface Conversation {
  id: number;
  /** The other participant (not the current user) */
  participant: ConversationParticipant;
  last_message: Message | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface SendMessagePayload {
  conversation_id: number;
  type: MessageType;
  body?: string;
}

