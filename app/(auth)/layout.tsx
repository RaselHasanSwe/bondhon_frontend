import type { Metadata } from 'next';
import { GuestGuard } from '@/components/auth/GuestGuard';

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | Bondhon',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FB] to-[#F0E8D0] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#C9A227]">বন্ধন</h1>
            <p className="text-sm text-gray-500 mt-1">Bondhon Matrimony</p>
          </div>
          {children}
        </div>
      </div>
    </GuestGuard>
  );
}

