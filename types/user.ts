export interface User {
    id: number;
    name: string;
    email: string;
    gender: 'male' | 'female';
    profile_created_by: 'self' | 'parents' | 'siblings';
    role: 'user' | 'admin';
    is_active: boolean;
    is_banned: boolean;
    subscription_plan: string;   // free-text tier: free | silver | gold | platinum | vip …
    subscription_expires_at: string | null;
    email_verified_at: string | null;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
    };
    message: string;
    errors: Record<string, string[]> | null;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: Record<string, string[]> | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

