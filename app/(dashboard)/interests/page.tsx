'use client';

import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {interestService} from '@/services/profileService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {formatAge, resolvePhotoUrl} from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import type {Interest} from '@/types/interest';
import {
    UserIcon, InboxIcon, OutboxIcon, CheckIcon, XIcon,
    ArrowLeftIcon, ArrowRightIcon,
} from '@/components/ui/icons';

type Tab = 'received' | 'sent';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    pending: {label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200'},
    accepted: {label: 'Accepted', className: 'bg-green-50 text-green-600 border-green-200'},
    declined: {label: 'Declined', className: 'bg-red-50   text-red-500   border-red-200'},
    ignored: {label: 'Ignored', className: 'bg-gray-50  text-gray-400  border-gray-200'},
    expired: {label: 'Expired', className: 'bg-gray-50  text-gray-400  border-gray-200'},
};

function InterestCard({
                          interest,
                          tab,
                          onAction,
                      }: {
    interest: Interest;
    tab: Tab;
    onAction?: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
}) {
    const profile = tab === 'received' ? interest.sender : interest.receiver;
    if (!profile) return null;

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : `#`;

    const status = STATUS_LABELS[interest.status] ?? STATUS_LABELS.pending;

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
                    <span className={`text-xs border rounded-full px-2.5 py-1 font-medium flex-shrink-0 ${status.className}`}>
                        {status.label}
                    </span>
                </div>

                {/* Actions for received pending interests */}
                {tab === 'received' && interest.status === 'pending' && onAction && (
                    <div className="flex items-center gap-2 mt-3">
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InterestsPage() {
    const [tab, setTab] = useState<Tab>('received');
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const {data: receivedData, isLoading: receivedLoading} = useQuery({
        queryKey: ['interests-received', page],
        queryFn: () => interestService.getReceived(page).then((r) => r.data),
        enabled: tab === 'received',
    });

    const {data: sentData, isLoading: sentLoading} = useQuery({
        queryKey: ['interests-sent', page],
        queryFn: () => interestService.getSent(page).then((r) => r.data),
        enabled: tab === 'sent',
    });

     const actionMutation = useMutation({
         mutationFn: ({id, action}: { id: number; action: 'accept' | 'decline' | 'ignore' }) => {
             if (action === 'accept') return interestService.accept(id);
             if (action === 'decline') return interestService.decline(id);
             return interestService.ignore(id);
         },
         onSuccess: (_, variables) => {
             queryClient.invalidateQueries({queryKey: ['interests-received']});
             const actionLabels = {
                 accept: 'Interest accepted!',
                 decline: 'Interest declined.',
                 ignore: 'Interest ignored.'
             };
             showSuccessToast(actionLabels[variables.action]);
         },
         onError: (error: any) => {
             const message = getErrorMessage(error);
             showErrorToast(message);
         }
     });

    const currentData = tab === 'received' ? receivedData : sentData;
    const isLoading = tab === 'received' ? receivedLoading : sentLoading;

    const paginated = currentData?.data as { data?: Interest[]; total?: number; last_page?: number } | undefined;
    const interests: Interest[] = paginated?.data ?? [];
    const lastPage = paginated?.last_page ?? 1;
    const total = paginated?.total ?? 0;

    const handleTabChange = (newTab: Tab) => {
        setTab(newTab);
        setPage(1);
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 md:pb-6">
            <h1 className="page-title mb-6 animate-fade-in-up">Interests</h1>

            {/* Tabs */}
            <div className="tab-pill-container flex gap-1 mb-6">
                {(['received', 'sent'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTabChange(t)}
                        className={`tab-pill flex-1 flex items-center justify-center gap-1.5 capitalize ${tab === t ? 'active' : ''}`}
                    >
                        {t === 'received' ? <InboxIcon size={14} strokeWidth={2}/> : <OutboxIcon size={14} strokeWidth={2}/>}
                        {t}
                        {t === 'received' && total > 0 && tab === 'received' && (
                            <span className="ml-1.5 bg-[var(--primary)] text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{total}</span>
                        )}
                    </button>
                ))}
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
                    {tab === 'received'
                        ? <InboxIcon size={48} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                        : <OutboxIcon size={48} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                    }
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>No {tab} interests yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {tab === 'received' ? 'When someone sends you an interest, it will appear here' : 'Interests you send will appear here'}
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
                    />
                ))}
            </div>

            {lastPage > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-page">
                        <ArrowLeftIcon size={14} strokeWidth={2}/> Previous
                    </button>
                    <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                    <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="btn-page">
                        Next <ArrowRightIcon size={14} strokeWidth={2}/>
                    </button>
                </div>
            )}
        </div>
    );
}

