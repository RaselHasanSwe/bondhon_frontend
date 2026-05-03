'use client';

import {useState, useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {matchService} from '@/services/profileService';
import {MatchCard} from '@/components/match/MatchCard';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import type {SearchFilters} from '@/types/match';
import type {ProfileCard} from '@/types/profile';
import {SearchIcon, FilterIcon, XIcon, ArrowLeftIcon, ArrowRightIcon} from '@/components/ui/icons';

const RELIGION_OPTIONS = ['Islam', 'Hindu', 'Christian', 'Buddhist', 'Other'];
const MARITAL_OPTIONS = [
    {value: 'never_married', label: 'Never Married'},
    {value: 'divorced', label: 'Divorced'},
    {value: 'widowed', label: 'Widowed'},
    {value: 'awaiting_divorce', label: 'Awaiting Divorce'},
];
const DIET_OPTIONS = [
    {value: 'non_vegetarian', label: 'Non-Vegetarian'},
    {value: 'vegetarian', label: 'Vegetarian'},
    {value: 'vegan', label: 'Vegan'},
    {value: 'jain', label: 'Jain'},
];

const DEFAULT_FILTERS: SearchFilters = {};

export default function SearchPage() {
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const {data, isLoading, isError} = useQuery({
        queryKey: ['search', appliedFilters, page],
        queryFn: () => matchService.search({...appliedFilters, page}).then((r) => r.data),
        enabled: true,
    });

    const paginatedData = data?.data as { data?: ProfileCard[]; total?: number; last_page?: number } | undefined;
    const results: ProfileCard[] = paginatedData?.data ?? [];
    const lastPage = paginatedData?.last_page ?? 1;
    const total = paginatedData?.total ?? 0;

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        setPage(1);
        setSidebarOpen(false);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setPage(1);
    };

    const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
        setFilters((prev) => ({...prev, [key]: value}));
    }, []);

    const FilterPanel = (
        <div className="space-y-5">
            <div>
                <h3 className="font-semibold text-foreground mb-3 text-sm" style={{fontFamily:'var(--font-heading)'}}>Quick Search</h3>
                <Input
                    placeholder="Search by BON-ID, city, name…"
                    value={filters.query ?? ''}
                    onChange={(e) => updateFilter('query', e.target.value || undefined)}
                    className="h-10 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                />
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Gender</Label>
                <div className="flex gap-2">
                    {['male', 'female'].map((g) => (
                        <button
                            key={g}
                            onClick={() => updateFilter('gender', (filters.gender === g ? undefined : g) as 'male' | 'female' | undefined)}
                            className={`flex-1 py-1.5 rounded-lg border text-sm capitalize transition-all ${
                                filters.gender === g
                                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)] font-medium'
                                    : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/40'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Age Range</Label>
                <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" min={18} max={80}
                           value={filters.age_min ?? ''}
                           onChange={(e) => updateFilter('age_min', e.target.value ? Number(e.target.value) : undefined)}
                           className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
                    <span className="text-muted-foreground text-sm">–</span>
                    <Input type="number" placeholder="Max" min={18} max={80}
                           value={filters.age_max ?? ''}
                           onChange={(e) => updateFilter('age_max', e.target.value ? Number(e.target.value) : undefined)}
                           className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
                </div>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Height (cm)</Label>
                <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" min={140} max={220}
                           value={filters.height_min ?? ''}
                           onChange={(e) => updateFilter('height_min', e.target.value ? Number(e.target.value) : undefined)}
                           className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
                    <span className="text-muted-foreground text-sm">–</span>
                    <Input type="number" placeholder="Max" min={140} max={220}
                           value={filters.height_max ?? ''}
                           onChange={(e) => updateFilter('height_max', e.target.value ? Number(e.target.value) : undefined)}
                           className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
                </div>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Religion</Label>
                <div className="flex flex-wrap gap-1.5">
                    {RELIGION_OPTIONS.map((r) => (
                        <button key={r}
                                onClick={() => updateFilter('religion', filters.religion === r ? undefined : r)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                    filters.religion === r
                                        ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)] font-medium'
                                        : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/40'
                                }`}
                        >{r}</button>
                    ))}
                </div>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Marital Status</Label>
                <select
                    value={filters.marital_status ?? ''}
                    onChange={(e) => updateFilter('marital_status', e.target.value || undefined)}
                    className="w-full border border-[var(--border)] bg-[var(--input)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground"
                >
                    <option value="">Any</option>
                    {MARITAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Location</Label>
                <Input placeholder="Country" value={filters.country ?? ''}
                       onChange={(e) => updateFilter('country', e.target.value || undefined)}
                       className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm mb-2"/>
                <Input placeholder="City" value={filters.city ?? ''}
                       onChange={(e) => updateFilter('city', e.target.value || undefined)}
                       className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Diet</Label>
                <select
                    value={filters.diet ?? ''}
                    onChange={(e) => updateFilter('diet', e.target.value || undefined)}
                    className="w-full border border-[var(--border)] bg-[var(--input)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground"
                >
                    <option value="">Any</option>
                    {DIET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div>
                <Label className="text-sm font-semibold text-foreground block mb-2">Search by Profile ID</Label>
                <Input placeholder="e.g. BON-001234" value={filters.profile_id ?? ''}
                       onChange={(e) => updateFilter('profile_id', e.target.value || undefined)}
                       className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] text-sm"/>
            </div>

            <div className="flex gap-2 pt-2">
                <button onClick={handleApplyFilters}
                        className="btn-gold flex-1"
                        style={{height:'2.5rem', borderRadius:'0.75rem', fontSize:'0.875rem'}}>
                    Apply Filters
                </button>
                <button onClick={handleClearFilters}
                        className="btn-outline-gold px-4"
                        style={{height:'2.5rem', borderRadius:'0.75rem', fontSize:'0.875rem'}}>
                    Clear
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 md:pb-6">
            <div className="mb-5 flex items-center justify-between animate-fade-in-up">
                <div>
                    <h1 className="page-title">Search Profiles</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total > 0 ? `${total} profiles found` : 'Use filters to find your match'}</p>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="btn-gold md:hidden flex items-center gap-1.5"
                    style={{height:'2.5rem', borderRadius:'0.75rem', padding:'0 1rem', fontSize:'0.875rem'}}
                >
                    <FilterIcon size={14} strokeWidth={2}/> Filters
                </button>
            </div>

            <div className="flex gap-6">
                {/* Desktop sidebar */}
                <aside className="hidden md:block w-72 flex-shrink-0">
                    <div className="card-premium p-5 sticky top-6">
                        <h2 className="font-semibold text-foreground mb-4" style={{fontFamily:'var(--font-heading)'}}>Search Filters</h2>
                        {FilterPanel}
                    </div>
                </aside>

                {/* Mobile filter drawer */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
                        <div className="absolute right-0 top-0 bottom-0 w-80 bg-card shadow-2xl p-5 overflow-y-auto border-l border-[var(--border)]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Filters</h2>
                                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground p-1 hover:text-foreground rounded-lg hover:bg-[var(--muted)] transition-colors">
                                    <XIcon size={18} strokeWidth={2}/>
                                </button>
                            </div>
                            {FilterPanel}
                        </div>
                    </div>
                )}

                {/* Results grid */}
                <div className="flex-1">
                    {isLoading && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({length: 8}).map((_, i) => (
                                <div key={i} className="skeleton-gold aspect-[3/4]"/>
                            ))}
                        </div>
                    )}

                    {isError && (
                        <div className="card-premium p-12 text-center">
                            <p className="text-destructive">Search failed. Please try again.</p>
                        </div>
                    )}

                    {!isLoading && !isError && results.length === 0 && (
                        <div className="card-premium p-16 text-center animate-fade-in-up">
                            <SearchIcon size={56} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                            <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>No profiles found</p>
                            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters for more results</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                                {results.map((profile) => (
                                    <MatchCard key={profile.id} profile={profile} showScore={false}/>
                                ))}
                            </div>

                            {lastPage > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-8">
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-page">
                                        <ArrowLeftIcon size={14} strokeWidth={2}/> Previous
                                    </button>
                                    <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                                    <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="btn-page">
                                        Next <ArrowRightIcon size={14} strokeWidth={2}/>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

