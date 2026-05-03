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
 *  - call.ended      → dismisses any active call UI
 */
export function CallProvider({children}: {children: React.ReactNode}) {
    const user = useAuthStore((s) => s.user);
    const {setIncomingCall, activeCall, endCall, clearIncomingCall, incomingCall} = useCallStore();

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

            // Incoming call
            channel.listen('.call.initiated', (e: IncomingCallPayload) => {
                if (cancelled) return;
                // Don't overwrite an active call
                setIncomingCall({
                    callId: e.call_id,
                    callType: e.type,
                    caller: e.caller,
                });
            });

            // Remote party ended call (while we were ringing or in call)
            channel.listen('.call.ended', (e: {call_id: number}) => {
                if (cancelled) return;
                if (incomingCall?.callId === e.call_id) {
                    clearIncomingCall();
                }
                if (activeCall?.callId === e.call_id) {
                    endCall();
                }
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
                }
                // Don't leave user channel here — other components (ChatWindow, CallScreen) also use it
                echo; // keep reference for cleanup
            })();
        };
    }, [user?.id, setIncomingCall, clearIncomingCall, endCall, activeCall, incomingCall]);

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

