'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

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
        formState: {errors, isSubmitting},
    } = useForm<FormData>({resolver: zodResolver(schema)});

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
                <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#FBF6E8] flex items-center justify-center text-center">
                    <svg className="w-7 h-7 text-[#C9A227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
                </div>
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
                        <div
                            className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </div>
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

