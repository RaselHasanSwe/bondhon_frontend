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
    onRemoteMediaStatus?: (isMuted: boolean, isCameraOff: boolean) => void;
}

/**
 * WebRTCManager — handles the full peer-to-peer WebRTC lifecycle.
 *
 * Signal flow (via Laravel Reverb):
 *   Caller  → createOffer → sendSignal(offer)  → Receiver setRemoteDescription
 *   Receiver → createAnswer → sendSignal(answer) → Caller setRemoteDescription
 *   Both    → onIceCandidate → sendSignal(ice-candidate) → addIceCandidate
 */
export class WebRTCManager {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private pendingCandidates: RTCIceCandidateInit[] = [];
    private isCaller: boolean;
    private opts: WebRTCManagerOptions;
    private destroyed = false;
    private dataChannel: RTCDataChannel | null = null;
    private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(opts: WebRTCManagerOptions) {
        this.opts = opts;
        this.isCaller = false; // set explicitly via start()
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /** Called by the CALLER after receiving answerCall response. */
    async startAsCaller(): Promise<void> {
        this.isCaller = true;
        await this._initPeerConnection();

        // Create data channel BEFORE offer so it's negotiated in SDP
        this.dataChannel = this.pc!.createDataChannel('media-status', {ordered: true});
        this._setupDataChannel(this.dataChannel);

        const offer = await this.pc!.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: this.opts.callType === 'video',
        });
        await this.pc!.setLocalDescription(offer);
        await this._sendSignal('offer', offer);
    }

    /** Called by the RECEIVER after answering, before creating answer. */
    async startAsReceiver(): Promise<void> {
        this.isCaller = false;
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
                // Queue until remote description is set
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

    /** Send local mute/camera status to remote peer via data channel */
    sendMediaStatus(isMuted: boolean, isCameraOff: boolean): void {
        if (this.dataChannel?.readyState === 'open') {
            try {
                this.dataChannel.send(JSON.stringify({type: 'media-status', isMuted, isCameraOff}));
            } catch { /* ignore */ }
        }
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
        if (this.dataChannel) {
            this.dataChannel.onmessage = null;
            this.dataChannel.close();
            this.dataChannel = null;
        }
        this.pc?.close();
        this.pc = null;
        this.pendingCandidates = [];
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private _setupDataChannel(channel: RTCDataChannel): void {
        channel.onmessage = (event) => {
            if (this.destroyed) return;
            try {
                const msg = JSON.parse(event.data as string);
                if (msg.type === 'media-status' && this.opts.onRemoteMediaStatus) {
                    this.opts.onRemoteMediaStatus(
                        Boolean(msg.isMuted),
                        Boolean(msg.isCameraOff),
                    );
                }
            } catch { /* ignore malformed messages */ }
        };
    }

    private async _initPeerConnection(): Promise<void> {
        const rtcConfig: RTCConfiguration = {
            iceServers: this.opts.iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        };

        this.pc = new RTCPeerConnection(rtcConfig);

        // Receiver: accept data channel opened by caller
        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this._setupDataChannel(this.dataChannel);
        };

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
            this.opts.onError(new Error('Could not access microphone/camera. Please allow permissions.'));
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
                // Auto-end after 8 seconds if still disconnected (network loss)
                this.disconnectTimer = setTimeout(() => {
                    if (this.pc?.iceConnectionState === 'disconnected' ||
                        this.pc?.iceConnectionState === 'failed') {
                        this.opts.onError(new Error('Connection lost. The call has ended.'));
                    }
                }, 8000);
            } else {
                // Reconnected or ended — clear the timer
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

    // ── ICaller check ─────────────────────────────────────────────────────

    get isCalling(): boolean {
        return this.isCaller;
    }
}

