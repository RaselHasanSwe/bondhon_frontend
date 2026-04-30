/**
 * chatService — wraps API calls for conversations and messages.
 * Connected to the Laravel backend API.
 *
 * API endpoints:
 *   GET    /api/v1/conversations
 *   POST   /api/v1/conversations                  (get or create with user_id)
 *   GET    /api/v1/conversations/{id}/messages
 *   POST   /api/v1/conversations/{id}/messages
 *   PUT    /api/v1/conversations/{id}/read
 *   POST   /api/v1/conversations/{id}/typing
 *   DELETE /api/v1/messages/{id}
 */

import api from '@/lib/api';
import type {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  SendMessagePayload,
} from '@/types/message';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const chatService = {
  /** Fetch all conversations for the current user */
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<ApiResponse<ConversationsResponse>>('/conversations');
    return res.data.data.data;
  },

  /** Get or create a conversation with another user (mutual interest required) */
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const res = await api.post<ApiResponse<Conversation>>('/conversations', { user_id: userId });
    return res.data.data;
  },

  /** Get a single conversation by id */
  async getConversation(id: number): Promise<Conversation> {
    const res = await api.get<ApiResponse<Conversation>>(`/conversations/${id}`);
    return res.data.data;
  },

  /** Fetch paginated messages for a specific conversation */
  async getMessages(conversationId: number, beforeId?: number): Promise<MessagesResponse> {
    const params: Record<string, number> = {};
    if (beforeId) params.before_id = beforeId;
    const res = await api.get<ApiResponse<MessagesResponse>>(
      `/conversations/${conversationId}/messages`,
      { params }
    );
    return res.data.data;
  },

  /** Send a new message (supports text, image, document) */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    if (payload.file) {
      const formData = new FormData();
      formData.append('type', payload.type);
      formData.append('file', payload.file);
      if (payload.body) formData.append('body', payload.body);
      if (payload.reply_to_message_id) {
        formData.append('reply_to_message_id', String(payload.reply_to_message_id));
      }
      const res = await api.post<ApiResponse<Message>>(
        `/conversations/${payload.conversation_id}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data.data;
    }

    const res = await api.post<ApiResponse<Message>>(
      `/conversations/${payload.conversation_id}/messages`,
      {
        type: payload.type,
        body: payload.body,
        reply_to_message_id: payload.reply_to_message_id,
      }
    );
    return res.data.data;
  },

  /** Mark all messages in a conversation as read */
  async markAsRead(conversationId: number): Promise<void> {
    await api.put(`/conversations/${conversationId}/read`);
  },

  /** Delete a message (soft delete — sender only) */
  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  /** Broadcast typing status to the conversation channel */
  async sendTyping(conversationId: number, isTyping: boolean): Promise<void> {
    await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
  },
};
