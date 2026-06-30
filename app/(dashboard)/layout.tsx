'use client';

import {useEffect, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import Link from 'next/link';
import {useAuthStore} from '@/store/authStore';
import {authService} from '@/services/authService';
import {faceScanService} from '@/services/faceScanService';
import {cn} from '@/lib/utils';
import {useSettings} from '@/lib/useSettings';
import {
    needsEmailVerification,
    isFaceScanEnabled,
    isFaceScanComplete,
    needsFaceScan,
    mergeUserUpdate,
} from '@/lib/authRedirect';
import {NotificationBell} from '@/components/notification/NotificationBell';
import {CallProvider} from '@/components/providers/CallProvider';
import {
    HomeIcon, MatchesIcon, SearchIcon, InterestIcon, ChatIcon,
    StarIcon, BellIcon, UserIcon, LogOutIcon, EyeIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type NavIconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

// Crown icon for subscription
function CrownIcon({size = 24, strokeWidth = 1.8, ...props}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
             strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 20h20M5 20V9l7-5 7 5v11"/>
            <path d="M9 20v-5h6v5"/>
        </svg>
    );
}


// Account disable request icon
function AccountDisableIcon({size = 24, strokeWidth = 1.8, ...props}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
             strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="17" y1="8" x2="23" y2="14"/>
            <line x1="23" y1="8" x2="17" y2="14"/>
        </svg>
    );
}

const NAV_ITEMS: { href: string; label: string; Icon: ComponentType<NavIconProps>; adminOnly?: boolean }[] = [
    {href: '/dashboard', label: 'Dashboard', Icon: HomeIcon},
    {href: '/matches', label: 'Matches', Icon: MatchesIcon},
    {href: '/search', label: 'Search', Icon: SearchIcon},
    {href: '/interests', label: 'Interests', Icon: InterestIcon},
    {href: '/chat', label: 'Messages', Icon: ChatIcon},
    {href: '/shortlist', label: 'Shortlist', Icon: StarIcon},
    {href: '/notifications', label: 'Notifications', Icon: BellIcon},
    {href: '/profile-views', label: 'Profile Viewers', Icon: EyeIcon},
    {href: '/profile/edit', label: 'My Profile', Icon: UserIcon},
    {href: '/subscription', label: 'Upgrade Plan', Icon: CrownIcon},
    {href: '/account-disable-request', label: 'Ac. Disable Request', Icon: AccountDisableIcon},
];

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const {isAuthenticated, user, clearAuth, updateUser} = useAuthStore();
    const {settings} = useSettings();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [mounted, setMounted] = useState(false);
    const [accessReady, setAccessReady] = useState(false);

    const faceScanEnabled = isFaceScanEnabled(settings.face_scan_enabled);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.replace('/login');
        }
    }, [mounted, isAuthenticated, router]);

    // Verify face-scan access before showing dashboard (prevents flash redirect)
    useEffect(() => {
        if (!mounted || !isAuthenticated || !user) return;

        if (needsEmailVerification(user)) {
            router.replace('/verify-email');
            return;
        }

        if (!needsFaceScan(user, faceScanEnabled)) {
            setAccessReady(true);
            return;
        }

        if (isFaceScanComplete(user.face_scan_status)) {
            setAccessReady(true);
            return;
        }

        let cancelled = false;

        faceScanService.getStatus()
            .then(res => {
                if (cancelled) return;
                const session = res.data.data.session;
                const status = session?.status ?? user.face_scan_status;

                if (status) {
                    updateUser({
                        face_scan_status: status,
                        face_scan_review_note: session?.review_note ?? user.face_scan_review_note,
                    });
                }

                if (!isFaceScanComplete(status)) {
                    router.replace('/face-scan');
                } else {
                    setAccessReady(true);
                }
            })
            .catch(() => {
                if (!cancelled) setAccessReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [mounted, isAuthenticated, user, faceScanEnabled, router]);

    useEffect(() => {
        if (!mounted || !isAuthenticated) return;
        authService.me()
            .then(res => {
                const freshUser = res.data?.data?.user;
                if (freshUser) updateUser(mergeUserUpdate(useAuthStore.getState().user, freshUser));
            })
            .catch(() => {/* silently ignore */
            });
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

    if (!mounted || !isAuthenticated || !user || !accessReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
                    <p className="text-sm text-muted-foreground">Loading your account…</p>
                </div>
            </div>
        );
    }

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
                            <a href="/">
                                <h1 className="text-xl font-bold leading-none text-gold-gradient">{settings.site_name}</h1>
                                <p className="text-[10px] text-muted-foreground/70 tracking-widest uppercase mt-2">{settings.site_slogan}</p>
                            </a>
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
                                style={{
                                    background: 'var(--gradient-gold-btn)',
                                    boxShadow: '0 2px 8px rgba(201,162,39,0.3)'
                                }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--sidebar-foreground)] truncate">{user.name}</p>
                                <span className="text-[11px] truncate">{user.email}</span>
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
                            <a href="/profile/edit" className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px]">{user.name}</a>
                        </div>
                    </div>

                    <div className="p-2 sm:p-4 lg:p-6 pb-20 md:pb-4">{children}</div>

                    {/* Mobile bottom nav */}
                    <nav
                        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--sidebar-border)] flex justify-around py-1.5 z-10 safe-area-pb backdrop-blur-sm"
                        style={{background: 'rgba(255,255,255,0.97)'}}>
                        {NAV_ITEMS.slice(0, 4).map((item) => {
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
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-muted-foreground transition-colors"
                        >
                            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                            <span>More</span>
                        </button>
                    </nav>

                    {drawerOpen && (
                        <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-[var(--sidebar-border)] pb-safe"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Handle */}
                                <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-2 font-medium">More options</p>

                                {/* Grid of remaining nav items */}
                                <div className="grid grid-cols-3 gap-1 px-3 pb-2">
                                    {NAV_ITEMS.slice(4).map((item) => {
                                        const active = pathname === item.href || pathname.startsWith(item.href);
                                        const isUpgrade = item.href === '/subscription';
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setDrawerOpen(false)}
                                                className={cn(
                                                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] text-center transition-colors',
                                                    isUpgrade
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : active
                                                            ? 'bg-[var(--sidebar-accent)] text-[var(--primary)]'
                                                            : 'text-muted-foreground hover:bg-gray-50'
                                                )}
                                            >
                                                <item.Icon size={22} strokeWidth={isUpgrade || active ? 2.1 : 1.8}/>
                                                <span className="leading-tight">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="h-px bg-gray-100 mx-4 my-1" />

                                {/* Sign out */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <LogOutIcon size={18} strokeWidth={1.8}/>
                                    Sign out
                                </button>

                                {/* Safe area spacer */}
                                <div className="h-4" />
                            </div>
                        </div>
                    )}
                </main>
            </CallProvider>
        </div>
    );
}
