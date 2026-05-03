'use client';

import {useQuery} from '@tanstack/react-query';
import {chatService} from '@/services/chatService';
import {ChatList} from '@/components/chat/ChatList';
import Link from 'next/link';

export default function ChatPage() {
    const {data: conversations = [], isLoading} = useQuery({
        queryKey: ['conversations'],
        queryFn: () => chatService.getConversations(),
    });

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Messages 💬</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalUnread > 0
                            ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
                            : 'All messages read'}
                    </p>
                </div>
            </div>

            {/* Desktop: two-panel layout hint */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Info banner */}
                <div className="px-4 py-3 bg-[#FBF6E8] border-b border-[#C9A227]/20 flex items-center gap-2">
                    <span className="text-sm">💡</span>
                    <p className="text-xs text-gray-600">
                        Chat is available only between users with{' '}
                        <span className="font-semibold text-[#C9A227]">mutually accepted interests</span>.
                    </p>
                </div>

                <ChatList conversations={conversations} isLoading={isLoading}/>

                {/* Empty CTA */}
                {!isLoading && conversations.length === 0 && (
                    <div className="p-8 text-center border-t border-gray-50">
                        <Link
                            href="/interests"
                            className="inline-block bg-[#C9A227] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#b8911f] transition-colors"
                        >
                            View Interests
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

