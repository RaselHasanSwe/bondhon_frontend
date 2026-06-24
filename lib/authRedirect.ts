import type {User} from '@/types/user';

/**
 * Determine the next onboarding step after login or registration.
 */
export function getPostAuthRedirect(user: User): string {
    if (user.email_verification_required && !user.email_verified_at) {
        return '/verify-email';
    }

    const faceScanDone = ['submitted', 'approved'].includes(user.face_scan_status ?? '');
    if (user.face_scan_required && !faceScanDone) {
        return '/face-scan';
    }

    return '/dashboard';
}

export function needsEmailVerification(user: User | null | undefined): boolean {
    return !!user?.email_verification_required && !user.email_verified_at;
}
