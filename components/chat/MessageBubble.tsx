'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/message';

// ── Resolve file URLs ─────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already an absolute URL (http/https or blob:)
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  // Strip leading slash if present, then prepend storage URL
  return `${API_URL}/storage/${path.replace(/^\//, '')}`;
}

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

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({ status }: { status: Message['status'] }) {
  if (!status) return null;
  if (status === 'sending') return <span className="text-gray-300">●</span>;
  if (status === 'sent') return <span className="text-gray-400">✓</span>;
  if (status === 'delivered') return <span className="text-gray-400">✓✓</span>;
  return <span className="text-[#C9A227]">✓✓</span>;
}

/** Inline audio player */
function AudioPlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        onClick={toggle}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
          isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-[#C9A227]/10 hover:bg-[#C9A227]/20'
        )}
      >
        {playing ? (
          <svg className={cn('w-4 h-4', isMine ? 'text-white' : 'text-[#C9A227]')} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={cn('w-4 h-4', isMine ? 'text-white' : 'text-[#C9A227]')} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div
          className={cn('h-1 rounded-full overflow-hidden', isMine ? 'bg-white/20' : 'bg-gray-200')}
          onClick={(e) => {
            const el = audioRef.current;
            if (!el || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            el.currentTime = ratio * duration;
          }}
          style={{ cursor: 'pointer' }}
        >
          <div
            className={cn('h-full rounded-full transition-all', isMine ? 'bg-white' : 'bg-[#C9A227]')}
            style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className={cn('text-[10px] mt-0.5 block', isMine ? 'text-white/60' : 'text-gray-400')}>
          {fmt(progress)} / {duration ? fmt(duration) : '0:00'}
        </span>
      </div>
    </div>
  );
}

/** Image with lightbox */
function ImageMessage({ src, isMine }: { src: string; isMine: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Shared image"
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-xl max-w-full max-h-60 object-cover cursor-zoom-in',
          isMine ? 'border-2 border-white/20' : ''
        )}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

/** Inline video player */
function VideoMessage({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      className="rounded-xl max-w-full max-h-60 object-cover"
    />
  );
}

/** Document / file download card */
function DocumentMessage({
  src,
  name,
  size,
  mime,
  isMine,
}: {
  src: string;
  name: string | null | undefined;
  size: number | null | undefined;
  mime: string | null | undefined;
  isMine: boolean;
}) {
  const isVideo = mime?.startsWith('video/');
  const isAudio = mime?.startsWith('audio/');
  if (isVideo) return <VideoMessage src={src} />;
  if (isAudio) return <AudioPlayer src={src} isMine={isMine} />;

  const ext = (name?.split('.').pop() ?? 'file').toUpperCase();
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      download={name ?? 'file'}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 min-w-[180px] transition-colors',
        isMine ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-100'
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0', isMine ? 'bg-white/20 text-white' : 'bg-[#C9A227]/10 text-[#C9A227]')}>
        {ext.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold truncate', isMine ? 'text-white' : 'text-[#1F2937]')}>
          {name ?? 'Document'}
        </p>
        {size && (
          <p className={cn('text-[10px]', isMine ? 'text-white/60' : 'text-gray-400')}>
            {formatSize(size)}
          </p>
        )}
      </div>
      <svg className={cn('w-4 h-4 flex-shrink-0', isMine ? 'text-white/70' : 'text-gray-400')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
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

  const isMedia = message.type !== 'text';

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
          'max-w-[72%] md:max-w-[60%] rounded-2xl shadow-sm',
          isMedia ? 'overflow-hidden' : 'px-4 py-2.5',
          isMine
            ? 'bg-[#C9A227] text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-[#1F2937] rounded-bl-sm'
        )}
      >
        {/* Reply preview */}
        {message.reply_to && (
          <div className={cn('text-xs px-3 pt-2.5 pb-1.5 border-l-2 mb-1 rounded-t', isMine ? 'border-white/40 bg-black/10' : 'border-[#C9A227] bg-gray-50')}>
            <span className={cn('font-semibold', isMine ? 'text-white/70' : 'text-[#C9A227]')}>Reply</span>
            <p className={cn('truncate', isMine ? 'text-white/60' : 'text-gray-400')}>{message.reply_to.body ?? '[media]'}</p>
          </div>
        )}

        {/* Content */}
        <div className={isMedia ? 'p-0' : undefined}>
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
          )}

          {message.type === 'image' && message.file_path && (
            <ImageMessage src={resolveUrl(message.file_path)!} isMine={isMine} />
          )}

          {message.type === 'voice' && message.file_path && (
            <div className="px-3 py-2.5">
              <AudioPlayer src={resolveUrl(message.file_path)!} isMine={isMine} />
            </div>
          )}

          {message.type === 'document' && message.file_path && (
            <div className="px-3 py-2.5">
              <DocumentMessage
                src={resolveUrl(message.file_path)!}
                name={message.file_name}
                size={message.file_size}
                mime={message.file_mime_type}
                isMine={isMine}
              />
            </div>
          )}
        </div>

        {/* Timestamp + status */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isMedia ? 'px-3 pb-2' : '',
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
