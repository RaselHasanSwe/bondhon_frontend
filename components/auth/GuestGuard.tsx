'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * GuestGuard — wraps auth pages (login, register, forgot-password …).
 *
 * • During SSR / before Zustand has hydrated from localStorage, renders children
 *   as-is so there is no flash of empty content.
 * • After hydration, if the user IS authenticated they are immediately
 *   redirected to /dashboard and the auth page is hidden.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Wait for client-side hydration before trusting the auth state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  // Before hydration: render children (avoid flicker)
  if (!mounted) return <>{children}</>;

  // Authenticated → hide the auth page while the redirect fires
  if (isAuthenticated) return null;

  return <>{children}</>;
}

