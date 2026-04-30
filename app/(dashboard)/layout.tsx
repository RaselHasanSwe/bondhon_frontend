'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notification/NotificationBell';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/matches', label: 'Matches', icon: '💑' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/interests', label: 'Interests', icon: '💌' },
  { href: '/chat', label: 'Messages', icon: '💬' },
  { href: '/shortlist', label: 'Shortlist', icon: '⭐' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/profile/edit', label: 'My Profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  // Zustand persist hydrates from localStorage asynchronously after the first render.
  // We must wait until the client is mounted before trusting isAuthenticated,
  // otherwise the layout redirects to /login on every page refresh.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  // Render nothing until hydration is complete (avoids flash / false redirect)
  if (!mounted || !isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 px-4 py-6 fixed h-full z-10">
        {/* Logo */}
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-[#C9A227]">বন্ধন</h1>
          <p className="text-xs text-gray-400 mt-0.5">Bondhon Matrimony</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-[#FBF6E8] text-[#C9A227]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#1F2937]'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#C9A227] flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1F2937] truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.subscription_plan} plan</p>
            </div>
            <NotificationBell />
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-[#C9A227]">বন্ধন</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-sm text-gray-600">{user.name}</span>
          </div>
        </div>

        <div className="p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-10">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors',
                pathname === item.href ? 'text-[#C9A227]' : 'text-gray-500'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

