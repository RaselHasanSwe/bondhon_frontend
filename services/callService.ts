import api from '@/lib/api';
import type {CallLog, CallType, InitiateCallResponse} from '@/types/call';

export const callService = {
    /**
     * Initiate an outgoing audio or video call to a user.
     * Returns the created CallLog + ICE server config.
     */
    async initiateCall(receiverId: number, type: CallType): Promise<InitiateCallResponse> {
        const res = await api.post('/calls/initiate', {receiver_id: receiverId, type});
        return res.data.data;
    },

    /** Accept an incoming call. Returns CallLog + ICE servers for the receiver. */
    async answerCall(callId: number): Promise<InitiateCallResponse> {
        const res = await api.put(`/calls/${callId}/answer`);
        return res.data.data;
    },

    /** Decline an incoming call. */
    async declineCall(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/decline`);
    },

    /** End an active call (caller or receiver can call this). */
    async endCall(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/end`);
    },

    /**
     * Send a WebRTC signaling message (offer, answer, or ICE candidate).
     * The backend relays it to the target user via Reverb.
     */
    async sendSignal(
        callId: number,
        toUserId: number,
        type: 'offer' | 'answer' | 'ice-candidate',
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
    ): Promise<void> {
        await api.post(`/calls/${callId}/signal`, {
            to_user_id: toUserId,
            type,
            payload,
        });
    },

    /** Fetch call history (paginated). */
    async getHistory(page = 1): Promise<{data: CallLog[]; pagination: {has_more: boolean; total: number; current_page: number; last_page: number}}> {
        const res = await api.get('/calls/history', {params: {page}});
        return res.data.data;
    },
};

