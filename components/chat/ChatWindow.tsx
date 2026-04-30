'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { chatService } from '@/services/chatService';
import type { Conversation, Message } from '@/types/message';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: number;
}

export function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const [conv, msgsResponse] = await Promise.all([
          chatService.getConversation(conversationId),
          chatService.getMessages(conversationId),
        ]);
        if (!active) return;
        setConversation(conv);
        setMessages(msgsResponse.data);
        await chatService.markAsRead(conversationId);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [conversationId]);

  // ── Scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Typing indicator (real-time via Laravel Echo) ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Dynamically import echo to avoid SSR issues
    import('@/lib/echo').then(({ getEcho }) => {
      const echo = getEcho();
      if (!echo) return;
      const channel = echo.private(`conversation.${conversationId}`);
      channel.listenForWhisper('typing', (e: { is_typing: boolean; user_id: number }) => {
        if (e.user_id !== currentUserId) {
          setIsTyping(e.is_typing);
          if (e.is_typing) {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setIsTyping(false), 4000);
          }
        }
      });
      return () => { echo.leave(`conversation.${conversationId}`); };
    });
  }, [conversationId, currentUserId]);

  // ── Real-time new messages via Echo ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('@/lib/echo').then(({ getEcho }) => {
      const echo = getEcho();
      if (!echo) return;
      const channel = echo.private(`conversation.${conversationId}`);
      channel.listen('MessageSent', (e: { message: Message }) => {
        if (e.message.sender_id !== currentUserId) {
          setMessages((prev) => [...prev, e.message]);
          setIsTyping(false);
          chatService.markAsRead(conversationId).catch(() => {});
        }
      });
    });
  }, [conversationId, currentUserId]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const body = text.trim();
    if (!body || isSending) return;

    // Optimistic update
    const optimistic: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      type: 'text',
      body,
      file_path: null,
      is_deleted: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setIsSending(true);

    try {
      const sent = await chatService.sendMessage({
        conversation_id: conversationId,
        type: 'text',
        body,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m))
      );
      // Simulate the other user typing a reply (demo)
      // (removed — real typing now comes via WebSocket)
      // Send typing indicator to backend
      chatService.sendTyping(conversationId, false).catch(() => {});
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'sent' as const } : m))
      );
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, conversationId, currentUserId]);

  const handleTypingChange = useCallback((value: string) => {
    setText(value);
    chatService.sendTyping(conversationId, true).catch(() => {});
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      chatService.sendTyping(conversationId, false).catch(() => {});
    }, 3000);
  }, [conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Group messages by date ────────────────────────────────────────────────
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const dateLabel = new Date(msg.created_at).toLocaleDateString('en-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) {
      last.messages.push(msg);
    } else {
      grouped.push({ date: dateLabel, messages: [msg] });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-2.5 bg-gray-200 rounded w-20" />
          </div>
        </div>
        {/* Body skeleton */}
        <div className="flex-1 bg-[#F8F9FB] p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-start' : 'justify-end'}`}>
              <div className="h-10 bg-gray-200 rounded-2xl animate-pulse" style={{ width: `${150 + i * 40}px` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Conversation not found.</p>
      </div>
    );
  }

  const { participant } = conversation;
  const initials = participant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden text-gray-500 hover:text-[#1F2937] mr-1"
          aria-label="Back"
        >
          ←
        </button>

        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          {participant.is_online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2937] truncate">{participant.name}</p>
          <p className="text-xs text-gray-400">
            {participant.is_online
              ? '🟢 Online'
              : participant.last_seen_at
              ? `Last seen ${new Date(participant.last_seen_at).toLocaleTimeString('en-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Offline'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-mono">
            {participant.profile_id}
          </span>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#F8F9FB] px-4 py-4 space-y-4">
        {grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium px-2 whitespace-nowrap">{date}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2">
              {dayMsgs.map((msg, idx) => {
                const isMine = msg.sender_id === currentUserId;
                const prevMsg = dayMsgs[idx - 1];
                const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMine={isMine}
                    senderName={participant.name}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {isTyping && (
          <TypingIndicator name={participant.name} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-[#F8F9FB] border border-gray-200 px-4 py-2.5 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#C9A227] text-white hover:bg-[#b8911f] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 self-end"
            aria-label="Send message"
          >
            {isSending ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          💌 Chat is only available between users with mutually accepted interests
        </p>
      </div>
    </div>
  );
}

