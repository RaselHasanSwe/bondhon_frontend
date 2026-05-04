import api from '@/lib/api';
import type { ApiResponse } from '@/types/user';
import type {
    InitiatePaymentResponse,
    PaymentHistoryItem,
    SubscriptionPlan,
    SubscriptionStatus,
    SwitchPlanResponse,
} from '@/types/subscription';

export const subscriptionService = {
    /** Get all active subscription plans */
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const res = await api.get<ApiResponse<SubscriptionPlan[]>>('/subscription/plans');
        return res.data.data;
    },

    /** Initiate a payment and get SSLCommerz redirect URL */
    initiate: async (planId: number): Promise<InitiatePaymentResponse> => {
        const res = await api.post<ApiResponse<InitiatePaymentResponse>>('/subscription/initiate', {
            plan_id: planId,
        });
        return res.data.data;
    },

    /** Get authenticated user's current subscription status */
    getStatus: async (): Promise<SubscriptionStatus> => {
        const res = await api.get<ApiResponse<SubscriptionStatus>>('/subscription/status');
        return res.data.data;
    },

    /** Get full payment history for the authenticated user */
    getHistory: async (): Promise<PaymentHistoryItem[]> => {
        const res = await api.get<ApiResponse<PaymentHistoryItem[]>>('/subscription/history');
        return res.data.data;
    },

    /** Switch the currently active plan to a different paid subscription */
    switchPlan: async (subscriptionId: number): Promise<SwitchPlanResponse> => {
        const res = await api.post<ApiResponse<SwitchPlanResponse>>(`/subscription/${subscriptionId}/switch`);
        return res.data.data;
    },
};
