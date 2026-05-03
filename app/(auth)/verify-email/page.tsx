'use client';

import {useEffect, useState, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

// ── Mode A: Verification callback (user clicked the email link) ─────────────
function VerifyCallback({vUrl}: { vUrl: string }) {
    const updateUser = useAuthStore((s) => s.updateUser);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const run = async () => {
            try {
                // Parse the backend signed URL to extract path params + query params
                const decoded = decodeURIComponent(vUrl);
                const parsed = new URL(decoded);
                const parts = parsed.pathname.split('/').filter(Boolean);
                // pathname: /api/v1/auth/email/verify/{id}/{hash}
                const id = parts[parts.length - 2];
                const hash = parts[parts.length - 1];
                const expires = parsed.searchParams.get('expires') ?? '';
                const signature = parsed.searchParams.get('signature') ?? '';

                const res = await authService.verifyEmail(id, hash, expires, signature);

                // Update local store if user is already logged in (same device / same browser)
                if (isAuthenticated) {
                    updateUser({email_verified_at: new Date().toISOString()});
                }

                const msg = res.data?.message ?? '';
                setStatus(msg.toLowerCase().includes('already') ? 'already' : 'success');
            } catch (err: unknown) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setErrorMsg(
                    axiosErr.response?.data?.message ??
                    'Verification failed. The link may be expired or invalid.'
                );
                setStatus('error');
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vUrl]);

    // ── loading ──
    if (status === 'loading') {
        return (
            <>
                <CardHeader>
                    <div className="mx-auto text-5xl mb-3 animate-pulse">📧</div>
                    <CardTitle className="text-2xl font-bold text-center">Verifying your email…</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-gray-500">Please wait a moment.</p>
                </CardContent>
            </>
        );
    }

    // ── success ──
    if (status === 'success') {
        return (
            <>
                <CardHeader>
                    <div className="mx-auto text-5xl mb-3">✅</div>
                    <CardTitle className="text-2xl font-bold text-center text-green-700">
                        Email Verified!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Your email has been verified successfully. Welcome to{' '}
                        <span className="font-semibold text-[#C9A227]">Bondhon</span>!
                    </p>
                    <Link href="/login">
                        <Button
                            className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11">
                            Sign In to Continue →
                        </Button>
                    </Link>
                </CardContent>
            </>
        );
    }

    // ── already verified ──
    if (status === 'already') {
        return (
            <>
                <CardHeader>
                    <div className="mx-auto text-5xl mb-3">☑️</div>
                    <CardTitle className="text-2xl font-bold text-center">Already Verified</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-gray-500 text-sm">Your email address is already verified.</p>
                    <Link href="/login">
                        <Button
                            className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11">
                            Go to Sign In →
                        </Button>
                    </Link>
                </CardContent>
            </>
        );
    }

    // ── error ──
    return (
        <>
            <CardHeader>
                <div className="mx-auto text-5xl mb-3">❌</div>
                <CardTitle className="text-2xl font-bold text-center text-red-600">
                    Verification Failed
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                </div>
                <p className="text-xs text-gray-400">
                    Links expire after 60 minutes. If your link has expired, sign in and request a new one.
                </p>
                <div className="flex flex-col gap-2">
                    <Link href="/login">
                        <Button
                            className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </>
    );
}

// ── Mode B: "Check your inbox" (redirect here after registration) ───────────
function CheckInbox() {
    const [resent, setResent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const handleResend = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.resendVerification();
            setResent(true);
        } catch {
            setError('Failed to resend. Please try again shortly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <CardHeader>
                <div className="mx-auto text-5xl mb-3">📧</div>
                <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-gray-500 text-sm leading-relaxed">
                    We&apos;ve sent a verification link to your email address. Please check your inbox and
                    click the link to activate your account.
                </p>

                {resent && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                        ✓ Verification email resent successfully!
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <p className="text-xs text-gray-400">Didn&apos;t receive it? Check your spam folder.</p>

                {isAuthenticated && (
                    <Button
                        onClick={handleResend}
                        disabled={loading || resent}
                        variant="outline"
                        className="w-full rounded-xl border-[#C9A227] text-[#C9A227] hover:bg-[#FBF6E8]"
                    >
                        {loading ? 'Sending…' : resent ? 'Email sent!' : 'Resend verification email'}
                    </Button>
                )}

                <p className="text-xs text-gray-400">
                    Already verified?{' '}
                    <Link href="/login" className="text-[#C9A227] hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </>
    );
}

// ── Inner component that reads searchParams (needs Suspense) ────────────────
function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const vUrl = searchParams.get('v_url');
    return vUrl ? <VerifyCallback vUrl={vUrl}/> : <CheckInbox/>;
}

// ── Page export ─────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
    return (
        <Card className="shadow-sm border-0 rounded-2xl">
            <Suspense
                fallback={
                    <CardContent className="py-16 text-center text-sm text-gray-400">
                        Loading…
                    </CardContent>
                }
            >
                <VerifyEmailContent/>
            </Suspense>
        </Card>
    );
}
