'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import {interestService} from '@/services/profileService';
import {chatService} from '@/services/chatService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {formatAge, resolvePhotoUrl} from '@/lib/utils';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizeFlatPage} from '@/lib/pagination';
import Image from 'next/image';
import Link from 'next/link';
import type {Interest} from '@/types/interest';
import type {ProfileCard} from '@/types/profile';
import {
    UserIcon, InboxIcon, OutboxIcon, CheckIcon, XIcon,
    ChatIcon, ClockIcon, SearchIcon, CheckCircleIcon,
} from '@/components/ui/icons';

type Tab = 'received' | 'sent' | 'contacts';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    pending: {label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200'},
    accepted: {label: 'Accepted', className: 'bg-green-50 text-green-600 border-green-200'},
    declined: {label: 'Declined', className: 'bg-red-50   text-red-500   border-red-200'},
    ignored: {label: 'Ignored', className: 'bg-gray-50  text-gray-400  border-gray-200'},
    expired: {label: 'Expired', className: 'bg-gray-50  text-gray-400  border-gray-200'},
};

const TAB_CONFIG: Record<Tab, { label: string; emptyTitle: string; emptyHint: string }> = {
    received: {
        label: 'Received',
        emptyTitle: 'No received interests yet',
        emptyHint: 'When someone sends you an interest, it will appear here',
    },
    sent: {
        label: 'Sent',
        emptyTitle: 'No sent interests yet',
        emptyHint: 'Interests you send will appear here',
    },
    contacts: {
        label: 'Contacts',
        emptyTitle: 'No contacts yet',
        emptyHint: 'Accepted interests will appear here and you can message each other',
    },
};

function getInterestProfile(interest: Interest, tab: Tab): ProfileCard | null {
    if (interest.connected_user) return interest.connected_user;
    if (tab === 'received') return interest.sender;
    if (tab === 'sent') return interest.receiver;
    return interest.sender ?? interest.receiver;
}

function InterestCard({
    interest,
    tab,
    onAction,
    onMessage,
    isMessaging,
}: {
    interest: Interest;
    tab: Tab;
    onAction?: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage?: (interest: Interest, profile: ProfileCard) => void;
    isMessaging?: boolean;
}) {
    const profile = getInterestProfile(interest, tab);
    if (!profile) return null;

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : `#`;

    const status = STATUS_LABELS[interest.status] ?? STATUS_LABELS.pending;
    const showStatus = tab !== 'contacts';

    return (
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 p-4 flex items-center gap-4">
            <Link href={profileUrl} className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--gold-50)]">
                    {resolvePhotoUrl(profile.primary_photo) ? (
                        <Image src={resolvePhotoUrl(profile.primary_photo)!} alt={profile.name} width={64} height={64}
                               className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <UserIcon size={28} className="text-[var(--gold-300)]" strokeWidth={1.5}/>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <Link href={profileUrl}
                              className="font-semibold text-foreground hover:text-[var(--primary)] transition-colors" style={{fontFamily:'var(--font-heading)'}}>
                            {profile.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {formatAge(profile.profile?.dob)}
                            {profile.profile?.city ? ` • ${profile.profile.city}` : ''}
                            {profile.religion ? ` • ${profile.religion}` : ''}
                        </p>
                        {profile.education && <p className="text-xs text-muted-foreground/70">{profile.education}</p>}
                    </div>
                    {showStatus && (
                        <span className={`text-xs border rounded-full px-2.5 py-1 font-medium flex-shrink-0 ${status.className}`}>
                            {status.label}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {tab === 'received' && interest.status === 'pending' && onAction && (
                        <>
                            <button
                                onClick={() => onAction(interest.id, 'accept')}
                                className="btn-gold flex items-center gap-1"
                                style={{height:'2rem', borderRadius:'0.5rem', padding:'0 0.875rem', fontSize:'0.75rem'}}
                            >
                                <CheckIcon size={12} strokeWidth={2.5}/> Accept
                            </button>
                            <button
                                onClick={() => onAction(interest.id, 'decline')}
                                className="px-4 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                                <XIcon size={12} strokeWidth={2.5}/> Decline
                            </button>
                            <button
                                onClick={() => onAction(interest.id, 'ignore')}
                                className="px-3 py-1.5 border border-[var(--border)] text-muted-foreground hover:bg-[var(--muted)] text-xs rounded-lg transition-colors"
                            >
                                Ignore
                            </button>
                        </>
                    )}

                    {interest.can_message && onMessage && (
                        <button
                            onClick={() => onMessage(interest, profile)}
                            disabled={isMessaging}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                        >
                            {isMessaging
                                ? <><ClockIcon size={12} strokeWidth={1.8}/> Opening…</>
                                : <><ChatIcon size={12} strokeWidth={1.8}/> Message</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InterestsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>('received');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [messagingId, setMessagingId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearchInput('');
        setDebouncedSearch('');
    }, [tab]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 350);
    }, []);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const {
        items: interests,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<Interest>({
        queryKey: ['interests', tab, debouncedSearch],
        queryFn: (page) => {
            const search = debouncedSearch || undefined;
            const service =
                tab === 'received' ? interestService.getReceived
                : tab === 'sent' ? interestService.getSent
                : interestService.getContacts;
            return service(page, search).then((r) => normalizeFlatPage(r.data.data, page));
        },
    });

    const actionMutation = useMutation({
        mutationFn: ({id, action}: { id: number; action: 'accept' | 'decline' | 'ignore' }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({queryKey: ['interests']});
            const actionLabels = {
                accept: 'Interest accepted!',
                decline: 'Interest declined.',
                ignore: 'Interest ignored.',
            };
            showSuccessToast(actionLabels[variables.action]);
        },
        onError: (error: unknown) => {
            showErrorToast(getErrorMessage(error));
        },
    });

    const handleMessage = async (interest: Interest, profile: ProfileCard) => {
        setMessagingId(interest.id);
        try {
            if (interest.conversation_id) {
                router.push(`/chat/${interest.conversation_id}`);
                return;
            }
            const conv = await chatService.getOrCreateConversation(profile.id);
            router.push(`/chat/${conv.id}`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            showErrorToast(
                err?.response?.data?.message
                || err?.message
                || 'Chat is only available after a mutual interest is accepted.',
            );
        } finally {
            setMessagingId(null);
        }
    };

    const tabEmptyIcon = tab === 'received'
        ? InboxIcon
        : tab === 'sent'
            ? OutboxIcon
            : CheckCircleIcon;
    const EmptyIcon = tabEmptyIcon;

    return (
        <div className="max-w-3xl mx-auto pb-20 md:pb-6">
            <h1 className="page-title mb-6 animate-fade-in-up">Interests</h1>

            <div className="tab-pill-container flex gap-1 mb-4">
                {(['received', 'sent', 'contacts'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`tab-pill flex-1 flex items-center justify-center gap-1.5 capitalize ${tab === t ? 'active' : ''}`}
                    >
                        {t === 'received' ? <InboxIcon size={14} strokeWidth={2}/>
                            : t === 'sent' ? <OutboxIcon size={14} strokeWidth={2}/>
                            : <CheckCircleIcon size={14} strokeWidth={2}/>}
                        {TAB_CONFIG[t].label}
                        {total > 0 && tab === t && (
                            <span className="ml-1.5 bg-[var(--primary)] text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{total}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative mb-5">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2}/>
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={`Search ${TAB_CONFIG[tab].label.toLowerCase()} by name, BON-ID, city, religion, profession…`}
                    className="w-full h-10 pl-10 pr-10 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                />
                {searchInput && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XIcon size={14} strokeWidth={2}/>
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="skeleton-gold h-24"/>
                    ))}
                </div>
            )}

            {!isLoading && interests.length === 0 && (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <EmptyIcon size={48} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>
                        {debouncedSearch
                            ? `No ${TAB_CONFIG[tab].label.toLowerCase()} match your search`
                            : TAB_CONFIG[tab].emptyTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {debouncedSearch
                            ? 'Try a different keyword'
                            : TAB_CONFIG[tab].emptyHint}
                    </p>
                </div>
            )}

            <div className="space-y-3 stagger">
                {interests.map((interest) => (
                    <InterestCard
                        key={interest.id}
                        interest={interest}
                        tab={tab}
                        onAction={(id, action) => actionMutation.mutate({id, action})}
                        onMessage={handleMessage}
                        isMessaging={messagingId === interest.id}
                    />
                ))}
            </div>

            {!isLoading && interests.length > 0 && (
                <InfiniteScrollFooter
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                    showEndMessage
                    endMessage="No more to show"
                />
            )}
        </div>
    );
}
