'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { AdminReport } from '@/types/admin';
import { Button } from '@/components/ui/button';

const REASON_LABELS: Record<string, string> = {
    fake_profile: 'Fake Profile',
    inappropriate_photo: 'Inappropriate Photo',
    abusive: 'Abusive Behaviour',
    spam: 'Spam',
    other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
    pending:      'bg-amber-100 text-amber-700',
    reviewed:     'bg-blue-100 text-blue-700',
    action_taken: 'bg-green-100 text-green-700',
    dismissed:    'bg-gray-100 text-gray-500',
};

export default function AdminReportsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);

    const { data: res, isLoading } = useQuery({
        queryKey: ['admin-reports', statusFilter, page],
        queryFn: () => adminService.getReports({ status: statusFilter || undefined, page }).then(r => r.data),
    });

    type ReportsData = { data: AdminReport[]; total: number; current_page: number; last_page: number };
    const reportsData: ReportsData | null = res?.data
        ? { data: (res.data as { data: AdminReport[] }).data ?? [], total: (res.data as { total: number }).total ?? 0, current_page: (res.data as { current_page: number }).current_page ?? 1, last_page: (res.data as { last_page: number }).last_page ?? 1 }
        : null;

    const actionMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.takeReportAction(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-0.5">Review and take action on user reports</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {['', 'pending', 'reviewed', 'action_taken', 'dismissed'].map(s => (
                    <button
                        key={s || 'all'}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            statusFilter === s
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {s === '' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reporter</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reported User</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(reportsData?.data ?? []).map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{report.reporter?.name ?? 'Unknown'}</div>
                                            {report.reporter?.profile?.profile_id && (
                                                <div className="text-xs text-gray-400">{report.reporter.profile.profile_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{report.reported?.name ?? 'Unknown'}</div>
                                            {report.reported?.profile?.profile_id && (
                                                <div className="text-xs text-gray-400">{report.reported.profile.profile_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                {REASON_LABELS[report.reason] ?? report.reason}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                                            {report.description ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] ?? ''}`}>
                                                {report.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {report.status === 'pending' && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'reviewed' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'action_taken' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                                    >
                                                        Action
                                                    </button>
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'dismissed' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(reportsData?.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                            No reports found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {reportsData && reportsData.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Page {reportsData.current_page} of {reportsData.last_page} ({reportsData.total} total)</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                            <Button variant="outline" size="sm" disabled={page >= reportsData.last_page} onClick={() => setPage(p => p + 1)}>Next →</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

