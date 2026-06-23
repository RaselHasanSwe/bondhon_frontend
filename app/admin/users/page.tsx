'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { AdminUser } from '@/types/admin';
import type { PaginatedResponse } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    );
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);

    const { data: res, isLoading } = useQuery({
        queryKey: ['admin-users', search, page],
        queryFn: () => adminService.getUsers({ search: search || undefined, page }).then(r => r.data),
    });

    const usersPage: PaginatedResponse<AdminUser> | null =
        (res?.data as { data?: AdminUser[]; total?: number; current_page?: number; last_page?: number } | null)
        ? { data: (res?.data as { data: AdminUser[] }).data ?? [], total: (res?.data as { total: number }).total ?? 0, current_page: (res?.data as { current_page: number }).current_page ?? 1, last_page: (res?.data as { last_page: number }).last_page ?? 1, per_page: 20 }
        : null;

    const banMutation = useMutation({
        mutationFn: ({ id, is_banned }: { id: number; is_banned: boolean }) =>
            adminService.banUser(id, is_banned),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    const verifyMutation = useMutation({
        mutationFn: (id: number) => adminService.verifyUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage all platform users</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                <Input
                    placeholder="Search by name or email…"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="border-gray-200"
                />
                <Button type="submit" variant="outline" className="shrink-0">Search</Button>
                {search && (
                    <Button type="button" variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="shrink-0">
                        Clear
                    </Button>
                )}
            </form>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Face</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(usersPage?.data ?? []).map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            {user.profile?.profile_id && (
                                                <div className="text-xs text-gray-400">{user.profile.profile_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={
                                                user.subscription_plan === 'platinum' ? 'bg-purple-100 text-purple-700' :
                                                user.subscription_plan === 'gold' ? 'bg-amber-100 text-amber-700' :
                                                user.subscription_plan === 'silver' ? 'bg-gray-100 text-gray-700' :
                                                'bg-gray-50 text-gray-500'
                                            }>
                                                {user.subscription_plan}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.deleted_at ? (
                                                <Badge className="bg-gray-100 text-gray-500">Deleted</Badge>
                                            ) : user.is_banned ? (
                                                <Badge className="bg-red-100 text-red-700">Banned</Badge>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.face_scan_session ? (
                                                <Badge className={
                                                    user.face_scan_session.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    user.face_scan_session.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }>
                                                    {user.face_scan_session.status === 'approved' ? '✅ Face OK' : user.face_scan_session.status === 'rejected' ? '❌ Face Rejected' : '⏳ Face Pending'}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-500">No Face</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.profile?.is_verified ? (
                                                <Badge className="bg-emerald-100 text-emerald-700">✓ Verified</Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-400">Unverified</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5 flex-wrap">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                                >
                                                    View
                                                </Link>
                                                {!user.deleted_at && (
                                                    <button
                                                        onClick={() => banMutation.mutate({ id: user.id, is_banned: !user.is_banned })}
                                                        disabled={banMutation.isPending}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                            user.is_banned
                                                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        {user.is_banned ? 'Unban' : 'Ban'}
                                                    </button>
                                                )}
                                                {!user.profile?.is_verified && user.profile && !user.deleted_at && (
                                                    <button
                                                        onClick={() => verifyMutation.mutate(user.id)}
                                                        disabled={verifyMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(usersPage?.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {usersPage && usersPage.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            Page {usersPage.current_page} of {usersPage.last_page} ({usersPage.total} total)
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline" size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                ← Prev
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                disabled={page >= usersPage.last_page}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

