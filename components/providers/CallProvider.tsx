'use client';

import {useEffect} from 'react';
import {useAuthStore} from '@/store/authStore';
import {useCallStore} from '@/store/callStore';
import {IncomingCallModal} from '@/components/call/IncomingCallModal';
import {CallScreen} from '@/components/call/CallScreen';
import type {IncomingCallPayload} from '@/types/call';

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
 */
export function CallProvider({children}: {children: React.ReactNode}) {
    const user = useAuthStore((s) => s.user);
    // Only read activeCall for rendering — event handlers use getState() to avoid stale closures
    const activeCall = useCallStore((s) => s.activeCall);

    useEffect(() => {
        if (!user?.id || typeof window === 'undefined') return;

        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getEcho} = await import('@/lib/echo');
            const echo = await getEcho();
            if (cancelled || !echo) return;

            channel = echo.private(`user.${user.id}`);

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
                if (ac?.callId === e.call_id) endCall();
            });

            // Caller cancelled / timed out while we haven't answered yet
            channel.listen('.call.declined', (e: {call_id: number}) => {
                if (cancelled) return;
                const {incomingCall, clearIncomingCall} = useCallStore.getState();
                if (incomingCall?.callId === e.call_id) clearIncomingCall();
            });
        })();

        return () => {
            cancelled = true;
            (async () => {
                const {getEcho} = await import('@/lib/echo');
                const echo = await getEcho();
                if (channel) {
                    channel.stopListening('.call.initiated');
                    channel.stopListening('.call.ended');
                    channel.stopListening('.call.declined');
                }
                echo;
            })();
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
