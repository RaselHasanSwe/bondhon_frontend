'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const res = await authService.login(data);
      const { user, token } = res.data.data;
      setAuth(user, token);

      if (!user.email_verified_at) {
        router.push('/verify-email');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Full error object:', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Login failed. Please try again.');
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-[#1F2937]">Welcome back</CardTitle>
        <CardDescription>Sign in to your Bondhon account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
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
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-[#C9A227] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="focus-visible:ring-[#C9A227]"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#C9A227] font-medium hover:underline">
            Create one free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

