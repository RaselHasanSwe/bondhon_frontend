import {callService} from '@/services/callService';
import type {IceServer} from '@/types/call';

type SignalType = 'offer' | 'answer' | 'ice-candidate';

interface WebRTCManagerOptions {
    callId: number;
    localUserId: number;
    remoteUserId: number;
    iceServers: IceServer[];
    callType: 'audio' | 'video';
    onRemoteStream: (stream: MediaStream) => void;
    onIceConnectionChange: (state: RTCIceConnectionState) => void;
    onError: (err: Error) => void;
}

/**
 * WebRTCManager — handles the full peer-to-peer WebRTC lifecycle.
 *
 * Signal flow (via Laravel Reverb):
 *   Caller  → createOffer → sendSignal(offer)  → Receiver setRemoteDescription
 *   Receiver → createAnswer → sendSignal(answer) → Caller setRemoteDescription
 *   Both    → onIceCandidate → sendSignal(ice-candidate) → addIceCandidate
 *
 * NOTE: No WebRTC data channel is used. Mute/camera status is relayed
 *       through the Laravel signaling endpoint (type: 'media-status') to
 *       avoid SCTP SDP attributes (a=sctp-port, a=max-message-size) that
 *       cause cross-browser RTCPeerConnection parse errors.
 */
export class WebRTCManager {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private pendingCandidates: RTCIceCandidateInit[] = [];
    private opts: WebRTCManagerOptions;
    private destroyed = false;
    private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(opts: WebRTCManagerOptions) {
        this.opts = opts;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /** Called by the CALLER after receiving answerCall response. */
    async startAsCaller(): Promise<void> {
        await this._initPeerConnection();

        const offer = await this.pc!.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: this.opts.callType === 'video',
        });
        await this.pc!.setLocalDescription(offer);
        await this._sendSignal('offer', offer);
    }

    /** Called by the RECEIVER after answering, before creating answer. */
    async startAsReceiver(): Promise<void> {
        await this._initPeerConnection();
    }

    /** Called when a WebRTC signal arrives from Reverb. */
    async handleRemoteSignal(
        type: SignalType,
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
    ): Promise<void> {
        if (this.destroyed || !this.pc) return;

        if (type === 'offer') {
            await this.pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            await this._flushPendingCandidates();
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            await this._sendSignal('answer', answer);

        } else if (type === 'answer') {
            await this.pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            await this._flushPendingCandidates();

        } else if (type === 'ice-candidate') {
            const candidate = payload as RTCIceCandidateInit;
            if (this.pc.remoteDescription) {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            } else {
                this.pendingCandidates.push(candidate);
            }
        }
    }

    /** Get the local MediaStream (for local video preview). */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /** Toggle local audio track. */
    setAudioEnabled(enabled: boolean): void {
        this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }

    /** Toggle local video track (video calls only). */
    setVideoEnabled(enabled: boolean): void {
        this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }

    /** Clean up everything. */
    destroy(): void {
        this.destroyed = true;
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        this.localStream?.getTracks().forEach((t) => t.stop());
        this.localStream = null;
        this.pc?.close();
        this.pc = null;
        this.pendingCandidates = [];
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private async _initPeerConnection(): Promise<void> {
        const rtcConfig: RTCConfiguration = {
            iceServers: this.opts.iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        };

        this.pc = new RTCPeerConnection(rtcConfig);

        // Acquire local media
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: this.opts.callType === 'video'
                    ? {width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 30}}
                    : false,
            });
        } catch (err) {
            const name = (err instanceof Error) ? err.name : '';
            let message: string;
            if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                message = 'No microphone or camera device was found. Please connect a device and try again.';
            } else if (name === 'NotReadableError' || name === 'TrackStartError') {
                message = 'Your microphone or camera is already in use by another application.';
            } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                message = 'Could not access microphone/camera. Please allow permissions.';
            } else {
                message = 'Could not access microphone/camera. Please check your device and permissions.';
            }
            this.opts.onError(new Error(message));
            throw err;
        }

        // Add tracks to peer connection
        this.localStream.getTracks().forEach((track) => {
            this.pc!.addTrack(track, this.localStream!);
        });

        // Remote stream
        this.pc.ontrack = (event) => {
            if (event.streams[0]) {
                this.opts.onRemoteStream(event.streams[0]);
            }
        };

        // ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate && !this.destroyed) {
                this._sendSignal('ice-candidate', event.candidate.toJSON()).catch(() => {});
            }
        };

        // Connection state
        this.pc.oniceconnectionstatechange = () => {
            if (!this.pc || this.destroyed) return;
            const state = this.pc.iceConnectionState;
            this.opts.onIceConnectionChange(state);

            if (state === 'disconnected') {
                this.disconnectTimer = setTimeout(() => {
                    if (this.pc?.iceConnectionState === 'disconnected' ||
                        this.pc?.iceConnectionState === 'failed') {
                        this.opts.onError(new Error('Connection lost. The call has ended.'));
                    }
                }, 8000);
            } else {
                if (this.disconnectTimer) {
                    clearTimeout(this.disconnectTimer);
                    this.disconnectTimer = null;
                }
            }
        };

        this.pc.onconnectionstatechange = () => {
            if (!this.pc || this.destroyed) return;
            if (this.pc.connectionState === 'failed') {
                this.opts.onError(new Error('WebRTC connection failed.'));
            }
        };
    }

    private async _sendSignal(type: SignalType, payload: RTCSessionDescriptionInit | RTCIceCandidateInit): Promise<void> {
        if (this.destroyed) return;
        await callService.sendSignal(
            this.opts.callId,
            this.opts.remoteUserId,
            type,
            payload,
        );
    }

    private async _flushPendingCandidates(): Promise<void> {
        for (const c of this.pendingCandidates) {
            await this.pc?.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        this.pendingCandidates = [];
    }
}
