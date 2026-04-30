/**
 * chatService — wraps API calls for conversations and messages.
 * Currently uses demo data; swap each function body with a real API call
 * once the Laravel backend is ready.
 *
 * API shape (future):
 *   GET  /api/v1/conversations
 *   GET  /api/v1/conversations/{id}/messages
 *   POST /api/v1/conversations/{id}/messages
 *   PUT  /api/v1/messages/{id}/read
 *   DELETE /api/v1/messages/{id}
 */

import type { Conversation, Message, SendMessagePayload } from '@/types/message';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES } from '@/lib/demo-data';

// In-memory mutable copy so UI updates feel real during demo
let conversations: Conversation[] = JSON.parse(JSON.stringify(DEMO_CONVERSATIONS)) as Conversation[];
const messages: Record<number, Message[]> = JSON.parse(JSON.stringify(DEMO_MESSAGES)) as Record<number, Message[]>;
let nextMessageId = 9000;

function sleep(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const chatService = {
  /** Fetch all conversations for the current user */
  async getConversations(): Promise<Conversation[]> {
    await sleep();
    return [...conversations].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });

    // ── Real API call (replace above with this) ──
    // const res = await api.get<ApiResponse<Conversation[]>>('/conversations');
    // return res.data.data;
  },

  /** Fetch messages for a specific conversation */
  async getMessages(conversationId: number): Promise<Message[]> {
    await sleep();
    return messages[conversationId] ?? [];

    // ── Real API call ──
    // const res = await api.get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`);
    // return res.data.data;
  },

  /** Send a new message */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    await sleep(200);

    const newMsg: Message = {
      id: nextMessageId++,
      conversation_id: payload.conversation_id,
      sender_id: 1, // current demo user id
      type: payload.type,
      body: payload.body ?? null,
      file_path: null,
      is_deleted: false,
      delivered_at: new Date().toISOString(),
      read_at: null,
      created_at: new Date().toISOString(),
      status: 'delivered',
    };

    if (!messages[payload.conversation_id]) {
      messages[payload.conversation_id] = [];
    }
    messages[payload.conversation_id].push(newMsg);

    // Update conversation's last message
    const idx = conversations.findIndex((c) => c.id === payload.conversation_id);
    if (idx !== -1) {
      conversations[idx] = {
        ...conversations[idx],
        last_message: newMsg,
        last_message_at: newMsg.created_at,
      };
    }

    return newMsg;

    // ── Real API call ──
    // const res = await api.post<ApiResponse<Message>>(`/conversations/${payload.conversation_id}/messages`, payload);
    // return res.data.data;
  },

  /** Mark messages in a conversation as read */
  async markAsRead(conversationId: number): Promise<void> {
    await sleep(100);

    if (messages[conversationId]) {
      messages[conversationId] = messages[conversationId].map((m) =>
        m.read_at ? m : { ...m, read_at: new Date().toISOString(), status: 'read' as const }
      );
    }

    const idx = conversations.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      conversations[idx] = { ...conversations[idx], unread_count: 0 };
    }

    // ── Real API call ──
    // await api.put(`/messages/${conversationId}/read`);
  },

  /** Delete a message (soft) */
  async deleteMessage(messageId: number, conversationId: number): Promise<void> {
    await sleep(150);

    if (messages[conversationId]) {
      messages[conversationId] = messages[conversationId].map((m) =>
        m.id === messageId ? { ...m, is_deleted: true, body: null } : m
      );
    }

    // ── Real API call ──
    // await api.delete(`/messages/${messageId}`);
  },

  /** Get a single conversation by id */
  async getConversation(id: number): Promise<Conversation | null> {
    await sleep(100);
    return conversations.find((c) => c.id === id) ?? null;
  },
};

