import api from './api';

export interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: string;
    currency: string;
    duration_days: number;
    features: string[];
    is_active: boolean;
    is_popular: boolean;
}

export interface UserSubscription {
    id: number;
    plan: SubscriptionPlan;
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    start_date: string | null;
    end_date: string | null;
    tx_ref: string;
    is_valid: boolean;
    created_at: string;
}

export interface PaymentResponse {
    checkout_url: string;
    tx_ref: string;
    plan: SubscriptionPlan;
}

// Fetch all active subscription plans
export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/subscriptions/plans/');
    return response.data;
};

// Get current user's active subscriptions
export const fetchMySubscription = async (): Promise<{ has_subscription: boolean; subscriptions: UserSubscription[]; message?: string }> => {
    const response = await api.get('/subscriptions/my_subscription/');
    return response.data;
};

// Fetch user subscription history
export const fetchSubscriptionHistory = async (): Promise<UserSubscription[]> => {
    const response = await api.get('/subscriptions/history/');
    return response.data;
};

// Initiate subscription payment
export const subscribeToPlan = async (planId: number): Promise<PaymentResponse> => {
    const response = await api.post('/subscriptions/subscribe/', { plan_id: planId });
    return response.data;
};

// Verify payment
export const verifyPayment = async (txRef: string): Promise<{ message: string; subscription: UserSubscription }> => {
    const response = await api.post('/subscriptions/verify/', { tx_ref: txRef });
    return response.data;
};
