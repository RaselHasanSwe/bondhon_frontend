'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { chatService } from '@/services/chatService';
import type { Conversation, Message, MessageType } from '@/types/message';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const ACCEPT_IMAGE = 'image/jpeg,image/png,image/gif,image/webp';
const ACCEPT_VIDEO = 'video/mp4,video/webm,video/quicktime';
const ACCEPT_FILE  = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMessageType(file: File): MessageType {
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

// ─── component ───────────────────────────────────────────────────────────────

export function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const router = useRouter();
  const [conversation, setConversation]   = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [text, setText]                   = useState('');
  const [isSending, setIsSending]         = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [hasMore, setHasMore]             = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // file upload state
  const [pendingFile, setPendingFile]       = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const imageRef     = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLInputElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const echoRef      = useRef<boolean>(false); // prevent double-subscription
  const initialScrollDone = useRef(false); // track first-load scroll

  // ── Initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setMessages([]);
    setHasMore(false);
    echoRef.current = false;
    initialScrollDone.current = false;

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
        setHasMore(msgsResponse.pagination.has_more);
        await chatService.markAsRead(conversationId);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [conversationId]);


  // ── Scroll to bottom on first load ───────────────────────────────────
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 30);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // ── Auto-scroll when new messages arrive or typing indicator changes ──
  // Only scroll if the user is already near the bottom (don't interrupt reading history)
  useEffect(() => {
    if (!initialScrollDone.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Auto-scroll only if within 150px of the bottom
    if (distFromBottom < 150) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    }
  }, [messages, isTyping]);

  // ── Scroll to bottom (always — used after user sends a message) ───────
  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, 30);
  }, []);

  // ── Real-time: subscribe to conversation channel ───────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || echoRef.current) return;
    echoRef.current = true;

    let channel: unknown = null;

    (async () => {
      const { getEcho } = await import('@/lib/echo');
      const echo = await getEcho();
      if (!echo) return;

      channel = echo.private(`conversation.${conversationId}`);

      // ── Incoming messages — backend broadcasts as 'message.sent' ──────
      // broadcastAs() → must use dot prefix: '.message.sent'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channel as any).listen('.message.sent', (e: Message) => {
        // Ignore own messages (already added optimistically)
        if (e.sender_id === currentUserId) return;

        setMessages((prev) => {
          // Deduplicate by id
          if (prev.some((m) => m.id === e.id)) return prev;
          return [...prev, e];
        });
        setIsTyping(false);
        // Scroll to bottom for incoming message
        setTimeout(() => scrollToBottom(), 50);
        chatService.markAsRead(conversationId).catch(() => {});
      });

      // ── Typing indicator — backend broadcasts as 'user.typing' ────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channel as any).listen('.user.typing', (e: { user_id: number; is_typing: boolean }) => {
        if (e.user_id === currentUserId) return;
        setIsTyping(e.is_typing);
        if (e.is_typing) {
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setIsTyping(false), 5000);
        } else {
          if (typingTimer.current) clearTimeout(typingTimer.current);
        }
      });
    })();

    return () => {
      (async () => {
        const { getEcho } = await import('@/lib/echo');
        const echo = await getEcho();
        echo?.leave(`conversation.${conversationId}`);
      })();
      echoRef.current = false;
    };
  }, [conversationId, currentUserId, scrollToBottom]);

  // ── Load older messages (scroll-up pagination) ────────────────────────
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    const oldestId = messages[0].id;
    const scrollEl = scrollRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;

    setIsLoadingMore(true);
    try {
      const res = await chatService.getMessages(conversationId, oldestId);
      if (res.data.length === 0) { setHasMore(false); return; }

      setMessages((prev) => [...res.data, ...prev]);
      setHasMore(res.pagination.has_more);

      // Restore scroll position so user doesn't jump to top
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight;
        }
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messages, conversationId]);

  // ── Scroll sentinel — fires loadMore when user scrolls near top ───────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 80) loadMore();
  }, [loadMore]);

  // ── File pick ─────────────────────────────────────────────────────────
  const handleFilePick = useCallback((file: File) => {
    setPendingFile(file);
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setPendingPreview(URL.createObjectURL(file));
    } else {
      setPendingPreview(null);
    }
  }, []);

  const clearPending = useCallback(() => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  }, [pendingPreview]);

  // ── Send ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const body = text.trim();
    if ((!body && !pendingFile) || isSending) return;

    const type: MessageType = pendingFile ? getMessageType(pendingFile) : 'text';

    const optimistic: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      type,
      body: body || null,
      file_path: pendingPreview ?? null,
      file_name: pendingFile?.name ?? null,
      file_size: pendingFile?.size ?? null,
      file_mime_type: pendingFile?.type ?? null,
      is_deleted: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    const fileToSend = pendingFile;
    clearPending();
    setIsSending(true);
    scrollToBottom();

    try {
      const sent = await chatService.sendMessage({
        conversation_id: conversationId,
        type,
        body: body || undefined,
        file: fileToSend ?? undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? sent : m)));
      chatService.sendTyping(conversationId, false).catch(() => {});
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'sent' as const } : m))
      );
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, pendingFile, pendingPreview, conversationId, currentUserId, clearPending, scrollToBottom]);

  const handleTypingChange = useCallback((value: string) => {
    setText(value);
    chatService.sendTyping(conversationId, true).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      chatService.sendTyping(conversationId, false).catch(() => {});
    }, 3000);
  }, [conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Group messages by date ─────────────────────────────────────────────
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const dateLabel = new Date(msg.created_at).toLocaleDateString('en-BD', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) last.messages.push(msg);
    else grouped.push({ date: dateLabel, messages: [msg] });
  }

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-2.5 bg-gray-200 rounded w-20" />
          </div>
        </div>
        <div className="flex-1 bg-[#F8F9FB] p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
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
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden text-gray-500 hover:text-[#1F2937] mr-1"
          aria-label="Back"
        >←</button>

        <div className="relative">
          {participant.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={participant.avatar} alt={participant.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          )}
          {participant.is_online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2937] truncate">{participant.name}</p>
          <p className="text-xs text-gray-400">
            {participant.is_online ? '🟢 Online'
              : participant.last_seen_at
              ? `Last seen ${new Date(participant.last_seen_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}`
              : 'Offline'}
          </p>
        </div>

        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-mono">
          {participant.profile_id}
        </span>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#F8F9FB] px-4 py-4 space-y-4"
      >
        {/* Load-more spinner at top */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <span className="w-5 h-5 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin" />
          </div>
        )}

        {/* "No more messages" hint */}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-[11px] text-gray-400 py-1">
            ✦ Beginning of conversation
          </p>
        )}

        {grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
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

        {isTyping && <TypingIndicator name={participant.name} />}
        <div ref={bottomRef} />
      </div>

      {/* ── File preview bar ──────────────────────────────────────────── */}
      {pendingFile && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-2.5 flex items-center gap-3">
          {pendingPreview && pendingFile.type.startsWith('image/') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingPreview} alt="preview" className="w-14 h-14 object-cover rounded-xl border border-gray-200" />
          )}
          {pendingPreview && pendingFile.type.startsWith('video/') && (
            <video src={pendingPreview} className="w-14 h-14 object-cover rounded-xl border border-gray-200" />
          )}
          {!pendingPreview && (
            <div className="w-14 h-14 rounded-xl bg-[#C9A227]/10 flex items-center justify-center border border-[#C9A227]/20">
              <span className="text-xl">📎</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1F2937] truncate">{pendingFile.name}</p>
            <p className="text-[11px] text-gray-400">{formatFileSize(pendingFile.size)}</p>
          </div>
          <button
            onClick={clearPending}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 flex items-center justify-center text-sm transition-colors"
            aria-label="Remove file"
          >✕</button>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3">
        {/* hidden file inputs */}
        <input ref={imageRef} type="file" accept={ACCEPT_IMAGE} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFilePick(f); e.target.value = ''; }} />
        <input ref={videoRef} type="file" accept={ACCEPT_VIDEO} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFilePick(f); e.target.value = ''; }} />
        <input ref={fileRef}  type="file" accept={ACCEPT_FILE}  className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFilePick(f); e.target.value = ''; }} />

        <div className="flex items-end gap-2">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1 mb-0.5">
            <button onClick={() => imageRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors" title="Send photo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button onClick={() => videoRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors" title="Send video">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors" title="Send file">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>

          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? 'Add a caption… (optional)' : 'Type a message… (Enter to send)'}
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-[#F8F9FB] border border-gray-200 px-4 py-2.5 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />

          <button
            onClick={handleSend}
            disabled={(!text.trim() && !pendingFile) || isSending}
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

