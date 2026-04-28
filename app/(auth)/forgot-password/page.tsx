'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerMessage(null);
    try {
      const res = await authService.forgotPassword(data.email);
      setServerMessage(res.data.message);
      setSubmitted(true);
    } catch (err: unknown) {
      // Backend always returns success to prevent enumeration, but handle network errors
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerMessage(
        axiosErr.response?.data?.message ??
          'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="mx-auto text-5xl mb-3 text-center">🔑</div>
        <CardTitle className="text-2xl font-bold text-[#1F2937] text-center">
          Forgot password?
        </CardTitle>
        <p className="text-sm text-gray-500 text-center mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </CardHeader>
      <CardContent>
        {submitted && serverMessage ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
              <p className="text-2xl mb-2">📬</p>
              {serverMessage}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="text-[#C9A227] hover:underline font-medium"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverMessage && !submitted && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {serverMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="focus-visible:ring-[#C9A227]"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11"
            >
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-gray-500">
          Remembered your password?{' '}
          <Link href="/login" className="text-[#C9A227] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

