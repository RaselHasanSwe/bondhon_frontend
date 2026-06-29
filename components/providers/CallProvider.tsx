'use client';

import {useEffect} from 'react';
import {useAuthStore} from '@/store/authStore';
import {useCallStore} from '@/store/callStore';
import {useNotificationStore} from '@/store/notificationStore';
import {queryClient} from '@/lib/queryClient';
import {
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateInterestQueries,
    invalidateNotificationQueries,
} from '@/lib/cacheInvalidation';
import {notificationService} from '@/services/notificationService';
import {IncomingCallModal} from '@/components/call/IncomingCallModal';
import {CallScreen} from '@/components/call/CallScreen';
import type {IncomingCallPayload} from '@/types/call';
import type {BackendNotification} from '@/types/notification';

/**
 * CallProvider
 *
 * Mounted at the root layout — listens on the current user's private
 * Reverb channel for incoming call events and renders the call UI.
 *
 * Handles:
 *  - call.initiated  → shows IncomingCallModal
 *  - call.ended      → dismisses any active call/incoming UI
 *  - call.declined   → dismisses incoming call UI (if we're still ringing)
 *  - notification.created → updates notification store + cache
 */
export function CallProvider({children}: {children: React.ReactNode}) {
    const user = useAuthStore((s) => s.user);
    // Only read activeCall for rendering — event handlers use getState() to avoid stale closures
    const activeCall = useCallStore((s) => s.activeCall);

    // Load bell notifications once per session (shared by sidebar + mobile bells)
    useEffect(() => {
        if (!user?.id) return;
        useNotificationStore.getState().fetchNotifications();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || typeof window === 'undefined') return;

        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getPrivateChannel} = await import('@/lib/echo');
            channel = await getPrivateChannel(`user.${user.id}`);
            if (cancelled || !channel) return;

            // Incoming call — show ring modal
            channel.listen('.call.initiated', (e: IncomingCallPayload) => {
                if (cancelled) return;
                useCallStore.getState().setIncomingCall({
                    callId: e.call_id,
                    callType: e.type,
                    caller: e.caller,
                });
            });

            // Remote party ended call (covers: caller cancels while we're ringing,
            // or other side ends while we're in CallScreen)
            channel.listen('.call.ended', (e: {call_id: number}) => {
                if (cancelled) return;
                const {incomingCall, activeCall: ac, clearIncomingCall, endCall} = useCallStore.getState();
                if (incomingCall?.callId === e.call_id) clearIncomingCall();
                if (ac?.callId === e.call_id) {
                    endCall();
                    // Notify chat windows to refresh call logs
                    window.dispatchEvent(new CustomEvent('call:ended'));
                }
            });

            // Caller cancelled / timed out while we haven't answered yet
            channel.listen('.call.declined', (e: {call_id: number}) => {
                if (cancelled) return;
                const {incomingCall, clearIncomingCall} = useCallStore.getState();
                if (incomingCall?.callId === e.call_id) clearIncomingCall();
            });

            channel.listen('.notification.created', (e: BackendNotification) => {
                if (cancelled) return;

                if (e.type === 'face_scan_rejected') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?face_scan_rejected=1';
                    return;
                }
                if (e.type === 'account_disable_request_banned') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_banned=1';
                    return;
                }
                if (e.type === 'admin_account_disabled' || e.type === 'account_disable_request_disabled') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_disabled=1';
                    return;
                }
                if (e.type === 'admin_account_banned') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_banned=1';
                    return;
                }

                useNotificationStore.getState().addNotification(notificationService.transformNotification(e));
                invalidateNotificationQueries(queryClient);
                if (e.type.startsWith('interest_')) {
                    invalidateInterestQueries(queryClient);
                    invalidateDashboardQueries(queryClient);
                }
                if (e.type === 'new_message') {
                    invalidateConversationQueries(queryClient);
                }
                if (e.type === 'profile_viewed') {
                    invalidateDashboardQueries(queryClient);
                }
            });
        })();

        return () => {
            cancelled = true;
            if (channel) {
                channel.stopListening('.call.initiated');
                channel.stopListening('.call.ended');
                channel.stopListening('.call.declined');
                channel.stopListening('.notification.created');
            }
        };
    // Re-subscribe only when the logged-in user changes
    }, [user?.id]);

    return (
        <>
            {children}

            {/* Incoming call ring overlay */}
            <IncomingCallModal/>

            {/* Active call screen */}
            {activeCall && <CallScreen currentUserId={user?.id ?? 0}/>}
        </>
    );
}
