'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

// Step schemas
const step1Schema = z.object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
    gender: z.enum(['male', 'female'], {error: 'Please select your gender'}),
    profile_created_by: z.enum(['self', 'parents', 'siblings']),
}).refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type Step1Form = z.infer<typeof step1Schema>;

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [step] = useState(1);
    const [serverError, setServerError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const {
        register,
        handleSubmit,
        watch,
        formState: {errors, isSubmitting},
    } = useForm<Step1Form>({resolver: zodResolver(step1Schema)});

    const onSubmitStep1 = async (data: Step1Form) => {
        setServerError(null);
        setFieldErrors({});
        try {
            const res = await authService.register(data);
            setAuth(res.data.data.user, res.data.data.token);
            router.push('/verify-email');  // → "check your inbox" page
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            setServerError(axiosErr.response?.data?.message ?? 'Registration failed. Please try again.');
            setFieldErrors(axiosErr.response?.data?.errors ?? {});
        }
    };

    return (
        <Card className="shadow-sm border-0 rounded-2xl">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-2xl font-bold text-[#1F2937]">Create account</CardTitle>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">Step {step} of 1</span>
                </div>
                <p className="text-sm text-gray-500">Start your journey to finding your life partner</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4" noValidate>
                    {serverError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {serverError}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" placeholder="Your full name"
                               className="focus-visible:ring-[#C9A227]" {...register('name')} />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" type="email" placeholder="you@example.com"
                               className="focus-visible:ring-[#C9A227]" {...register('email')} />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label>I am a</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['male', 'female'] as const).map((g) => (
                                <label
                                    key={g}
                                    className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-colors capitalize ${
                                        watch('gender') === g ? 'border-[#C9A227] bg-[#FBF6E8] text-[#C9A227] font-semibold' : 'border-gray-200 text-gray-600 hover:border-[#C9A227]/50'
                                    }`}
                                >
                                    <input type="radio" value={g} {...register('gender')} className="sr-only"/>
                                    {g === 'male' ? '👨 Groom' : '👩 Bride'}
                                </label>
                            ))}
                        </div>
                        {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                    </div>

                    {/* Profile created by */}
                    <div className="space-y-1.5">
                        <Label>Profile created by</Label>
                        <select
                            {...register('profile_created_by')}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                        >
                            <option value="self">Self</option>
                            <option value="parents">Parents</option>
                            <option value="siblings">Siblings</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Min. 8 characters"
                               className="focus-visible:ring-[#C9A227]" {...register('password')} />
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input id="password_confirmation" type="password" placeholder="Repeat password"
                               className="focus-visible:ring-[#C9A227]" {...register('password_confirmation')} />
                        {errors.password_confirmation &&
                            <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white font-semibold rounded-xl h-11"
                    >
                        {isSubmitting ? 'Creating account…' : 'Create Account'}
                    </Button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#C9A227] font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

