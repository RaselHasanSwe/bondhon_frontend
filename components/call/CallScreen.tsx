'use client';

import {useEffect, useRef, useCallback, useState} from 'react';
import Swal from 'sweetalert2';
import {useCallStore} from '@/store/callStore';
import {callService} from '@/services/callService';
import {WebRTCManager} from '@/lib/webrtc';
import type {WebRTCSignalPayload} from '@/types/call';
import {cfImageUrl} from '@/lib/utils';

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface CallScreenProps {
    currentUserId: number;
}

export function CallScreen({currentUserId}: CallScreenProps) {
    const {
        activeCall,
        toggleMic,
        toggleCamera,
        toggleSpeaker,
        endCall,
    } = useCallStore();

    const managerRef = useRef<WebRTCManager | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ringbackCtxRef = useRef<AudioContext | null>(null);
    const ringbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [connectionState, setConnectionState] = useState<string>('Connecting…');
    const [isEnding, setIsEnding] = useState(false);
    const [isPipSwapped, setIsPipSwapped] = useState(false);

    const destroyManager = useCallback(() => {
        managerRef.current?.destroy();
        managerRef.current = null;
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    }, []);

    const handleEnd = useCallback(async () => {
        if (!activeCall || isEnding) return;
        setIsEnding(true);
        destroyManager();
        try {
            await callService.endCall(activeCall.callId);
        } catch (err: unknown) {
            // 409 means the call was already ended by the other party — that's fine, ignore it.
            const status = (err as {response?: {status?: number}})?.response?.status;
            if (status !== 409) {
                // Any other error is unexpected but we still close the UI
                console.error('[endCall]', err);
            }
        } finally {
            endCall();
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('call:ended'));
            }
        }
    }, [activeCall, isEnding, destroyManager, endCall]);

    // ── beforeunload: end call when browser/tab closes ────────────────────
    useEffect(() => {
        if (!activeCall?.callId) return;
        const callId = activeCall.callId;
        const handleBeforeUnload = () => {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const url = `${process.env.NEXT_PUBLIC_API_URL}/calls/${callId}/end`;
            // fetch with keepalive is reliable in beforeunload
            fetch(url, {
                method: 'PUT',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                keepalive: true,
            }).catch(() => {});
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeCall?.callId]);

    // ── Ringback tone for caller (plays while status === 'ringing') ───────
    useEffect(() => {
        const isRinging = activeCall?.isCaller && activeCall?.status === 'ringing';
        if (!isRinging) {
            // Stop ringback
            if (ringbackIntervalRef.current) clearInterval(ringbackIntervalRef.current);
            ringbackIntervalRef.current = null;
            if (ringbackCtxRef.current) {
                ringbackCtxRef.current.close().catch(() => {});
                ringbackCtxRef.current = null;
            }
            return;
        }

        const AudioCtx =
            window.AudioContext ||
            (window as typeof window & {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
        if (!AudioCtx) return;

        const playRingback = () => {
            try {
                if (!ringbackCtxRef.current || ringbackCtxRef.current.state === 'closed') {
                    ringbackCtxRef.current = new AudioCtx();
                }
                const ctx = ringbackCtxRef.current;
                if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                // Two-tone ringback (440 Hz + 480 Hz blend, 1.5s on / 2s off pattern)
                [440, 480].forEach((freq) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.09, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 1.5);
                });
            } catch { /* ignore */ }
        };

        playRingback();
        ringbackIntervalRef.current = setInterval(playRingback, 3500);

        return () => {
            if (ringbackIntervalRef.current) clearInterval(ringbackIntervalRef.current);
            ringbackIntervalRef.current = null;
            if (ringbackCtxRef.current) {
                ringbackCtxRef.current.close().catch(() => {});
                ringbackCtxRef.current = null;
            }
        };
    }, [activeCall?.isCaller, activeCall?.status]);

    // ── Set up WebRTC + Reverb signaling ─────────────────────────────────
    useEffect(() => {
        if (!activeCall) return;

        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getPrivateChannel} = await import('@/lib/echo');
            channel = await getPrivateChannel(`user.${currentUserId}`);
            if (cancelled || !channel) return;

            const manager = new WebRTCManager({
                callId: activeCall.callId,
                localUserId: currentUserId,
                remoteUserId: activeCall.remoteParticipant.id,
                iceServers: activeCall.iceServers,
                callType: activeCall.callType,

                onRemoteStream: (stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                        remoteVideoRef.current.play().catch(() => {});
                    }
                    // Ensure status is 'active' and timer is running
                    useCallStore.getState().setCallStatus('active');
                    setConnectionState('Connected');
                    if (!durationIntervalRef.current) {
                        durationIntervalRef.current = setInterval(
                            () => useCallStore.getState().tickDuration(),
                            1000,
                        );
                    }
                },

                onIceConnectionChange: (state) => {
                    const labels: Partial<Record<RTCIceConnectionState, string>> = {
                        checking:     'Connecting…',
                        connected:    'Connected',
                        completed:    'Connected',
                        failed:       'Connection failed',
                        disconnected: 'Reconnecting…',
                        closed:       'Ended',
                    };
                    setConnectionState(labels[state] ?? state);

                    // Fallback: start timer as soon as ICE connects in case ontrack fires late
                    if (state === 'connected' || state === 'completed') {
                        useCallStore.getState().setCallStatus('active');
                        if (!durationIntervalRef.current) {
                            durationIntervalRef.current = setInterval(
                                () => useCallStore.getState().tickDuration(),
                                1000,
                            );
                        }
                    }

                    if (state === 'failed') handleEnd();
                },

                onError: async (err) => {
                    const msg = err.message.toLowerCase();
                    const isDeviceError = msg.includes('device') || msg.includes('not found') || msg.includes('in use');
                    const isPermission = isDeviceError || msg.includes('permission') ||
                        msg.includes('access') || msg.includes('microphone') || msg.includes('camera');
                    const isLost = msg.includes('connection lost') || msg.includes('connection failed');

                    setConnectionState(isPermission ? 'Device error' : err.message);

                    if (isLost) {
                        destroyManager();
                        try { await callService.endCall(activeCall.callId); } catch { /* ignore */ }
                        endCall();
                        return;
                    }

                    await Swal.fire({
                        title: isDeviceError ? 'Device Not Found' : isPermission ? 'Permission Required' : 'Call Error',
                        text: err.message,
                        icon: 'error',
                        confirmButtonColor: '#C9A227',
                        customClass: {popup: 'rounded-2xl'},
                    });

                    if (isPermission) handleEnd();
                },
            });

            managerRef.current = manager;

            // Inbound WebRTC signals
            channel.listen('.webrtc.signal', async (e: WebRTCSignalPayload) => {
                if (cancelled || e.call_id !== activeCall.callId) return;

                // Media-status is relayed via signaling (no data channel)
                if (e.type === 'media-status') {
                    const ms = e.payload as {isMuted: boolean; isCameraOff: boolean};
                    useCallStore.getState().setRemoteMediaStatus(
                        Boolean(ms.isMuted),
                        Boolean(ms.isCameraOff),
                    );
                    return;
                }

                await manager.handleRemoteSignal(
                    e.type as 'offer' | 'answer' | 'ice-candidate',
                    e.payload as RTCSessionDescriptionInit | RTCIceCandidateInit,
                );
            });

            // Remote party ended
            channel.listen('.call.ended', (e: {call_id: number}) => {
                if (cancelled || e.call_id !== activeCall.callId) return;
                destroyManager();
                endCall();
                Swal.fire({
                    title: 'Call Ended',
                    text: 'The other party has ended the call.',
                    icon: 'info',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    customClass: {popup: 'rounded-2xl'},
                });
            });

            // Remote party declined (while caller is ringing)
            channel.listen('.call.declined', (e: {call_id: number}) => {
                if (cancelled || e.call_id !== activeCall.callId) return;
                destroyManager();
                endCall();
                Swal.fire({
                    title: 'Call Declined',
                    text: 'The other party declined the call.',
                    icon: 'info',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    customClass: {popup: 'rounded-2xl'},
                });
            });

            // Caller starts after receiver answers
            if (activeCall.isCaller) {
                setConnectionState('Ringing…');
                channel.listen('.call.answered', async (e: {call_id: number}) => {
                    if (cancelled || e.call_id !== activeCall.callId) return;
                    setConnectionState('Connecting…');
                    useCallStore.getState().setCallStatus('connecting');
                    await manager.startAsCaller();
                    const ls = manager.getLocalStream();
                    if (ls && localVideoRef.current) {
                        localVideoRef.current.srcObject = ls;
                        localVideoRef.current.play().catch(() => {});
                    }
                });
            } else {
                // Receiver: start immediately, offer will arrive
                await manager.startAsReceiver();
                setConnectionState('Connecting…');
                useCallStore.getState().setCallStatus('connecting');
                const ls = manager.getLocalStream();
                if (ls && localVideoRef.current) {
                    localVideoRef.current.srcObject = ls;
                    localVideoRef.current.play().catch(() => {});
                }
            }
        })();

        return () => {
            cancelled = true;
            destroyManager();
            (async () => {
                if (channel) {
                    channel.stopListening('.webrtc.signal');
                    channel.stopListening('.call.ended');
                    channel.stopListening('.call.declined');
                    channel.stopListening('.call.answered');
                }
            })();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCall?.callId]);

    // Sync local mute/camera to WebRTC tracks
    useEffect(() => {
        managerRef.current?.setAudioEnabled(!(activeCall?.isMicMuted ?? false));
    }, [activeCall?.isMicMuted]);

    useEffect(() => {
        managerRef.current?.setVideoEnabled(!(activeCall?.isCameraOff ?? false));
    }, [activeCall?.isCameraOff]);

    // Broadcast local media status to remote peer via signaling server
    useEffect(() => {
        if (!activeCall || activeCall.status !== 'active') return;
        callService.sendSignal(
            activeCall.callId,
            activeCall.remoteParticipant.id,
            'media-status',
            {isMuted: activeCall.isMicMuted, isCameraOff: activeCall.isCameraOff},
        ).catch(() => {});
    }, [activeCall?.isMicMuted, activeCall?.isCameraOff, activeCall?.status]);

    if (!activeCall) return null;

    const {callType, remoteParticipant, isMicMuted, isCameraOff, isSpeakerOff, durationSeconds, status, remoteMicMuted, remoteCameraOff} = activeCall;
    const isVideo = callType === 'video';
    const initials = remoteParticipant.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    // Wrapper handlers — toggle store state; the useEffect above broadcasts the change
    const handleToggleMic = () => { toggleMic(); };
    const handleToggleCamera = () => { toggleCamera(); };

    // ── Audio call layout ─────────────────────────────────────────────────
    if (!isVideo) {
        return (
            <div className="fixed inset-0 z-[9998] flex flex-col bg-linear-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
                {/* Hidden audio players */}
                <video ref={remoteVideoRef} autoPlay playsInline className="hidden"/>
                <video ref={localVideoRef} autoPlay playsInline muted className="hidden"/>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 shrink-0">
                    <span className="text-[11px] sm:text-xs text-white/40 font-medium uppercase tracking-widest">
                        Audio Call
                    </span>
                    <StatusIndicator state={status}/>
                </div>

                {/* Center — avatar */}
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="relative mb-6 sm:mb-8">
                        {status === 'active' && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-[#C9A227]/20 animate-ping"/>
                                <div className="absolute -inset-3 rounded-full bg-[#C9A227]/10 animate-ping" style={{animationDelay: '0.4s'}}/>
                            </>
                        )}
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-white/20"/>
                        ) : (
                            <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-linear-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center">
                                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 text-center px-4 max-w-xs sm:max-w-sm truncate">
                        {remoteParticipant.name}
                    </h2>
                    {remoteParticipant.profile_id && (
                        <p className="text-xs text-white/30 font-mono mb-3">{remoteParticipant.profile_id}</p>
                    )}
                    <p className="text-base sm:text-lg text-white/60 tabular-nums">
                        {status === 'active' ? formatDuration(durationSeconds) : connectionState}
                    </p>

                    {/* Local mic muted indicator */}
                    {isMicMuted && (
                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                            <span className="text-xs text-red-400 font-medium">You are muted</span>
                        </div>
                    )}

                    {/* Remote mic muted indicator (WhatsApp-style) */}
                    {remoteMicMuted && status === 'active' && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                            <span className="text-xs text-orange-400 font-medium">{remoteParticipant.name} muted</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <CallControls
                    isVideo={false}
                    isMicMuted={isMicMuted}
                    isCameraOff={isCameraOff}
                    isSpeakerOff={isSpeakerOff}
                    isEnding={isEnding}
                    onToggleMic={handleToggleMic}
                    onToggleCamera={handleToggleCamera}
                    onToggleSpeaker={toggleSpeaker}
                    onEnd={handleEnd}
                />
            </div>
        );
    }

    // ── Video call layout ─────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9998] bg-black flex flex-col">
            {/* Remote video (full bg) */}
            <div className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Remote placeholder while connecting */}
                {status !== 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-[#1a1a2e] to-[#0f0f1a]">
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white/20 mb-4"/>
                        ) : (
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-linear-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center mb-4">
                                <span className="text-3xl sm:text-4xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                        <p className="text-white text-lg sm:text-xl font-semibold">{remoteParticipant.name}</p>
                        <p className="text-white/55 text-sm mt-1">{connectionState}</p>
                    </div>
                )}

                {/* Remote camera-off overlay (WhatsApp-style) */}
                {remoteCameraOff && status === 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a2e]/90">
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/20 mb-3"/>
                        ) : (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-br from-[#C9A227] to-[#D4AF37] flex items-center justify-center mb-3">
                                <span className="text-3xl sm:text-4xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                        <p className="text-white/60 text-sm">Camera off</p>
                    </div>
                )}

                {/* Local video PiP — tappable to swap */}
                <div
                    className={`absolute z-20 border-2 border-white/20 bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all active:scale-95
                        ${isPipSwapped
                            ? 'bottom-4 left-4 w-24 h-32 sm:w-32 sm:h-44'
                            : 'top-4 right-4 w-24 h-32 sm:w-32 sm:h-44'}`}
                    onClick={() => setIsPipSwapped((p) => !p)}
                    title="Tap to swap"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isCameraOff ? 'invisible' : ''}`}
                    />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
                            <span className="text-sm font-bold text-white/50">OFF</span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                    </div>
                </div>

                {/* Top HUD */}
                <div className="absolute top-0 left-0 right-0 px-3 sm:px-4 pt-safe py-3 sm:py-4 flex items-center justify-between
                                bg-linear-to-b from-black/60 to-transparent">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-base sm:text-lg leading-tight truncate max-w-[180px] sm:max-w-xs">
                                {remoteParticipant.name}
                            </p>
                            {/* Remote muted badge in HUD */}
                            {remoteMicMuted && status === 'active' && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/30 border border-orange-500/40">
                                    <svg className="w-3 h-3 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                        <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        <p className="text-white/65 text-xs sm:text-sm tabular-nums">
                            {status === 'active' ? formatDuration(durationSeconds) : connectionState}
                        </p>
                    </div>
                    <StatusIndicator state={status}/>
                </div>
            </div>

            {/* Controls */}
            <CallControls
                isVideo={true}
                isMicMuted={isMicMuted}
                isCameraOff={isCameraOff}
                isSpeakerOff={isSpeakerOff}
                isEnding={isEnding}
                onToggleMic={handleToggleMic}
                onToggleCamera={handleToggleCamera}
                onToggleSpeaker={toggleSpeaker}
                onEnd={handleEnd}
            />
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface CallControlsProps {
    isVideo: boolean;
    isMicMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOff: boolean;
    isEnding: boolean;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    onToggleSpeaker: () => void;
    onEnd: () => void;
}

function CallControls({isVideo, isMicMuted, isCameraOff, isSpeakerOff, isEnding, onToggleMic, onToggleCamera, onToggleSpeaker, onEnd}: CallControlsProps) {
    return (
        <div className="shrink-0 bg-black/85 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-5 safe-area-pb">
            <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 max-w-sm sm:max-w-md mx-auto">
                {/* Mute / Unmute */}
                <CtrlBtn
                    active={isMicMuted}
                    label={isMicMuted ? 'Unmute' : 'Mute'}
                    onClick={onToggleMic}
                    icon={
                        isMicMuted ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/>
                            </svg>
                        )
                    }
                />

                {/* Camera toggle (video only) */}
                {isVideo && (
                    <CtrlBtn
                        active={isCameraOff}
                        label={isCameraOff ? 'Camera' : 'Hide'}
                        onClick={onToggleCamera}
                        icon={
                            isCameraOff ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18"/>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                            )
                        }
                    />
                )}

                {/* End Call */}
                <button
                    onClick={onEnd}
                    disabled={isEnding}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-60
                               flex items-center justify-center shadow-xl shadow-red-500/40 transition-all"
                    aria-label="End call"
                >
                    {isEnding ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                    ) : (
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white rotate-135" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                        </svg>
                    )}
                </button>

                {/* Speaker */}
                <CtrlBtn
                    active={isSpeakerOff}
                    label={isSpeakerOff ? 'Speaker' : 'Sound'}
                    onClick={onToggleSpeaker}
                    icon={
                        isSpeakerOff ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                            </svg>
                        )
                    }
                />

                {/* Placeholder to balance when no camera button */}
                {!isVideo && <div className="w-12 sm:w-14 opacity-0 pointer-events-none"/>}
            </div>
        </div>
    );
}

function CtrlBtn({label, active, onClick, icon}: {label: string; active: boolean; onClick: () => void; icon: React.ReactNode}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95
                    ${active ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20 text-white/75'}`}
                aria-label={label}
            >
                {icon}
            </button>
            <span className="text-[10px] sm:text-[11px] text-white/45 leading-none">{label}</span>
        </div>
    );
}

function StatusIndicator({state}: {state: string}) {
    const isLive = state === 'active';
    return (
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold
            ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}/>
            <span className="hidden xs:inline">{isLive ? 'Live' : 'Connecting'}</span>
        </div>
    );
}
