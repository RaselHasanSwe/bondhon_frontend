'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuthStore } from '@/store/authStore';

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: PageProps) {
  const { conversationId } = use(params);
  const convId = Number(conversationId);
  const user = useAuthStore((s) => s.user);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  });

  // Demo: current user id is 1
  const currentUserId = user?.id ?? 1;

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-6">
      {/* Mobile: just the chat window */}
      <div className="md:hidden h-[calc(100vh-9rem)] flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ChatWindow conversationId={convId} currentUserId={currentUserId} />
      </div>

      {/* Desktop: two-panel split */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-100">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#1F2937]">Messages 💬</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList conversations={conversations} activeId={convId} isLoading={isLoading} />
          </div>
        </div>

        {/* Right: chat window */}
        <div className="flex-1 flex flex-col">
          <ChatWindow conversationId={convId} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

