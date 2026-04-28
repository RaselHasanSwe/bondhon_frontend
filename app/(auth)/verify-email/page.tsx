'use client';

import { useState } from 'react';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <Card className="shadow-sm border-0 rounded-2xl text-center">
      <CardHeader>
        <div className="mx-auto text-5xl mb-3">📧</div>
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-500 text-sm leading-relaxed">
          We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
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

        <Button
          onClick={handleResend}
          disabled={loading || resent}
          variant="outline"
          className="w-full rounded-xl border-[#C9A227] text-[#C9A227] hover:bg-[#FBF6E8]"
        >
          {loading ? 'Sending…' : resent ? 'Email sent!' : 'Resend verification email'}
        </Button>
      </CardContent>
    </Card>
  );
}

