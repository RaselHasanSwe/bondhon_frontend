'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderName?: string;
  showAvatar?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusIcon({ status }: { status: Message['status'] }) {
  if (!status) return null;
  if (status === 'sending') return <span className="text-gray-300">●</span>;
  if (status === 'sent') return <span className="text-gray-400">✓</span>;
  if (status === 'delivered') return <span className="text-gray-400">✓✓</span>;
  return <span className="text-[#C9A227]">✓✓</span>; // read
}

export function MessageBubble({ message, isMine, senderName, showAvatar = true }: MessageBubbleProps) {
  if (message.is_deleted) {
    return (
      <div className={cn('flex items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
        {showAvatar && !isMine && (
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
            {senderName?.charAt(0).toUpperCase() ?? '?'}
          </div>
        )}
        <div className="italic text-xs text-gray-400 px-3 py-2">This message was deleted</div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 self-end">
          {senderName?.charAt(0).toUpperCase() ?? '?'}
        </div>
      ) : (
        !isMine && <div className="w-7 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[72%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm transition-all',
          isMine
            ? 'bg-[#C9A227] text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-[#1F2937] rounded-bl-sm'
        )}
      >
        {message.type === 'text' && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
        )}

        {message.type === 'image' && message.file_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.file_path}
            alt="Shared image"
            className="rounded-xl max-w-full max-h-64 object-cover"
          />
        )}

        {message.type === 'voice' && (
          <div className="flex items-center gap-2">
            <span className="text-lg">🎵</span>
            <div className={cn('flex gap-0.5 items-center', isMine ? 'text-white/80' : 'text-gray-400')}>
              {[3, 5, 4, 7, 5, 3, 6, 4, 5, 3].map((h, i) => (
                <div
                  key={i}
                  className={cn('w-1 rounded-full', isMine ? 'bg-white/70' : 'bg-gray-300')}
                  style={{ height: `${h * 3}px` }}
                />
              ))}
            </div>
            <span className={cn('text-xs', isMine ? 'text-white/70' : 'text-gray-400')}>0:12</span>
          </div>
        )}

        {/* Timestamp + status */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isMine ? 'text-white/70' : 'text-gray-400'
          )}
        >
          <span className="text-[10px]">{formatTime(message.created_at)}</span>
          {isMine && (
            <span className="text-[10px]">
              <StatusIcon status={message.status} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

