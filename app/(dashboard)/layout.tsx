'use client';

import {useEffect, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import Link from 'next/link';
import {useAuthStore} from '@/store/authStore';
import {authService} from '@/services/authService';
import {cn} from '@/lib/utils';
import {useSettings} from '@/lib/useSettings';
import {NotificationBell} from '@/components/notification/NotificationBell';
import {CallProvider} from '@/components/providers/CallProvider';
import {
    HomeIcon, MatchesIcon, SearchIcon, InterestIcon, ChatIcon,
    StarIcon, BellIcon, UserIcon, LogOutIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type NavIconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

// Crown icon for subscription
function CrownIcon({size = 24, strokeWidth = 1.8, ...props}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 20h20M5 20V9l7-5 7 5v11"/>
            <path d="M9 20v-5h6v5"/>
        </svg>
    );
}


const NAV_ITEMS: { href: string; label: string; Icon: ComponentType<NavIconProps>; adminOnly?: boolean }[] = [
    {href: '/dashboard',    label: 'Dashboard',    Icon: HomeIcon},
    {href: '/matches',      label: 'Matches',      Icon: MatchesIcon},
    {href: '/search',       label: 'Search',       Icon: SearchIcon},
    {href: '/interests',    label: 'Interests',    Icon: InterestIcon},
    {href: '/chat',         label: 'Messages',     Icon: ChatIcon},
    {href: '/shortlist',    label: 'Shortlist',    Icon: StarIcon},
    {href: '/notifications',label: 'Notifications',Icon: BellIcon},
    {href: '/subscription', label: 'Upgrade Plan', Icon: CrownIcon},
    {href: '/profile/edit', label: 'My Profile',   Icon: UserIcon},
];

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const {isAuthenticated, user, clearAuth, updateUser} = useAuthStore();
    const {settings} = useSettings();

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

    useEffect(() => {
        if (!mounted || !isAuthenticated || !user) return;

        const faceScanEnabled = settings.face_scan_enabled === '1' || settings.face_scan_enabled === 'true' || settings.face_scan_enabled === 'yes' || settings.face_scan_enabled === 'on';
        const faceScanDone = ['submitted', 'approved'].includes(user.face_scan_status ?? '');
        const isOnFaceScan = pathname === '/face-scan';

        if (faceScanEnabled && user.face_scan_required && !faceScanDone && !isOnFaceScan) {
            router.replace('/face-scan');
        }
    }, [mounted, isAuthenticated, user, settings.face_scan_enabled, router]);



    // ── Sync fresh user data from the server on every mount so the sidebar
    //    always shows the latest subscription_plan (auth store can be stale
    //    if the plan was purchased after the last login).
    useEffect(() => {
        if (!mounted || !isAuthenticated) return;
        authService.me()
            .then(res => {
                const freshUser = res.data?.data?.user;
                if (freshUser) updateUser(freshUser);
            })
            .catch(() => {/* silently ignore — stale store data is acceptable fallback */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, isAuthenticated]);

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
        <div className="flex min-h-screen bg-background">
            <CallProvider>
            {/* Sidebar */}
            <aside
                className="hidden md:flex flex-col w-64 border-r border-[var(--sidebar-border)] px-3 lg:px-4 py-4 lg:py-6 fixed h-full z-10 overflow-y-auto"
                style={{background: 'var(--gradient-sidebar)'}}>
                {/* Logo */}
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-2.5">
                        <div>
                            <h1 className="text-xl font-bold leading-none text-gold-gradient">{settings.site_name}</h1>
                            <p className="text-[10px] text-muted-foreground/70 tracking-widest uppercase mt-0.5">Matrimony</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    active
                                        ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] border-l-2 border-[var(--primary)] pl-[10px]'
                                        : 'text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)]/60 hover:text-[var(--sidebar-foreground)]'
                                )}
                            >
                                <item.Icon size={18} strokeWidth={active ? 2.2 : 1.8}/>
                                {item.label}
                            </Link>
                        );
                    })}
                    {/* Admin link — only visible to admins */}
                    {user.role === 'admin' && (
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-amber-600 hover:bg-amber-50"
                        >
                            <span className="text-base">⚙️</span>
                            Admin Panel
                        </Link>
                    )}
                </nav>

                {/* User section */}
                <div className="border-t border-[var(--sidebar-border)] pt-4 mt-4">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{background: 'var(--gradient-gold-btn)', boxShadow: '0 2px 8px rgba(201,162,39,0.3)'}}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--sidebar-foreground)] truncate">{user.name}</p>
                            <span className="text-xs">{user.email}</span>
                        </div>
                        <NotificationBell placement="sidebar"/>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <LogOutIcon size={16} strokeWidth={1.8}/>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 md:ml-64 min-w-0">
                {/* Mobile top bar */}
                <div
                    className="md:hidden border-b border-[var(--sidebar-border)] px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
                    style={{background: 'rgba(255,255,255,0.95)'}}>
                    <h1 className="text-base sm:text-lg font-bold text-gold-gradient">{settings.site_name}</h1>
                    <div className="flex items-center gap-2">
                        <NotificationBell/>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px]">{user.name}</span>
                    </div>
                </div>

                <div className="p-2 sm:p-4 lg:p-6 pb-20 md:pb-4">{children}</div>

                {/* Mobile bottom nav */}
                <nav
                    className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--sidebar-border)] flex justify-around py-1.5 z-10 safe-area-pb backdrop-blur-sm"
                    style={{background: 'rgba(255,255,255,0.97)'}}>
                {NAV_ITEMS.slice(0, 5).map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 px-1 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs transition-colors min-w-0',
                                    active ? 'text-[var(--primary)]' : 'text-muted-foreground'
                                )}
                            >
                                <item.Icon size={20} strokeWidth={active ? 2.2 : 1.8}/>
                                <span className="truncate w-full text-center leading-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </main>
        </CallProvider>
        </div>
    );
}

