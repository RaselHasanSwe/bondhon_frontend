'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matchService } from '@/services/profileService';
import { MatchCard } from '@/components/match/MatchCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { SearchFilters } from '@/types/match';
import type { ProfileCard } from '@/types/profile';
import { useOptions, useChildOptions } from '@/hooks/useSelectOptions';
import { useAuthStore } from '@/store/authStore';
import {
    SearchIcon, FilterIcon, XIcon,
    ArrowLeftIcon, ArrowRightIcon,
} from '@/components/ui/icons';

// ── helpers ──────────────────────────────────────────────────────────────────

const INCOME_OPTIONS = [
    { value: '100000',  label: '1 Lakh+' },
    { value: '300000',  label: '3 Lakh+' },
    { value: '500000',  label: '5 Lakh+' },
    { value: '1000000', label: '10 Lakh+' },
    { value: '2000000', label: '20 Lakh+' },
    { value: '5000000', label: '50 Lakh+' },
];

const SORT_OPTIONS = [
    { value: 'latest',     label: 'Newest Members' },
    { value: 'age_asc',    label: 'Age: Youngest First' },
    { value: 'age_desc',   label: 'Age: Oldest First' },
    { value: 'completion', label: 'Profile Completeness' },
];

const DEFAULT_FILTERS: SearchFilters = {};

function countActiveFilters(f: SearchFilters): number {
    const skip = new Set(['page', 'sort', 'query', 'profile_id']);
    return Object.entries(f).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== '' && v !== null).length;
}

function toOpts(items: { value: string; label: string }[]) { return items; }

// ── FilterPanel ───────────────────────────────────────────────────────────────

interface FilterPanelProps {
    filters: SearchFilters;
    onUpdate: <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => void;
    onApply: () => void;
    onClear: () => void;
}

function FilterPanel({ filters, onUpdate, onApply, onClear }: FilterPanelProps) {
    const { data: religionOpts = [] }       = useOptions('religion');
    const { data: maritalOpts = [] }        = useOptions('marital_status');
    const { data: educationOpts = [] }      = useOptions('education_level');
    const { data: professionOpts = [] }     = useOptions('profession');
    const { data: employedInOpts = [] }     = useOptions('employed_in');
    const { data: dietOpts = [] }           = useOptions('diet');
    const { data: smokingOpts = [] }        = useOptions('smoking');
    const { data: drinkingOpts = [] }       = useOptions('drinking');
    const { data: bodyTypeOpts = [] }       = useOptions('body_type');
    const { data: complexionOpts = [] }     = useOptions('complexion');
    const { data: bloodGroupOpts = [] }     = useOptions('blood_group');
    const { data: motherTongueOpts = [] }   = useOptions('mother_tongue');
    const { data: nationalityOpts = [] }    = useOptions('nationality');
    const { data: countryOpts = [] }        = useOptions('country');
    const { data: residingStatusOpts = [] } = useOptions('residing_status');
    const { data: haveChildrenOpts = [] }   = useOptions('have_children');

    const selectedReligionId = religionOpts.find(o => o.value === filters.religion)?.id;
    const { data: casteOpts = [] } = useChildOptions('caste', selectedReligionId);

    const selectedCountryId = countryOpts.find(o => o.value === filters.country)?.id;
    const { data: stateOpts = [] } = useChildOptions('country', selectedCountryId);
    const isBangladesh = filters.country === 'bangladesh';
    const selectedBdDivisionId = stateOpts.find(o => o.value === filters.city)?.id;
    const { data: bdDistrictOpts = [] } = useChildOptions('country', isBangladesh ? selectedBdDivisionId : undefined);
    const shouldHideCity = filters.country === 'united_states' || filters.country === 'canada';

    const sec = (title: string, children: React.ReactNode) => (
        <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 pt-1">{title}</h4>
            {children}
            <div className="border-b border-[var(--border)]/50" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm rounded-xl border border-border p-2">
                <div className="flex gap-2">
                    <button onClick={onApply} className="btn-gold flex-1"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', fontSize: '0.842rem' }}>
                        Apply Filters
                    </button>
                    <button onClick={onClear} className="btn-outline-gold px-4"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                        Clear
                    </button>
                </div>
            </div>

            {sec('Gender', (
                <div className="flex gap-2">
                    {(['male', 'female'] as const).map(g => (
                        <button key={g}
                            onClick={() => onUpdate('gender', filters.gender === g ? undefined : g)}
                            className={`flex-1 py-1.5 rounded-xl border text-sm capitalize transition-all ${
                                filters.gender === g
                                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)] font-semibold'
                                    : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/50'
                            }`}
                        >{g}</button>
                    ))}
                </div>
            ))}

            {sec('Age Range', (
                <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" min={18} max={100}
                        value={filters.age_min ?? ''}
                        onChange={e => onUpdate('age_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm" />
                    <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
                    <Input type="number" placeholder="Max" min={18} max={100}
                        value={filters.age_max ?? ''}
                        onChange={e => onUpdate('age_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm" />
                </div>
            ))}

            {sec('Height (cm)', (
                <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" min={140} max={220}
                        value={filters.height_min ?? ''}
                        onChange={e => onUpdate('height_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm" />
                    <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
                    <Input type="number" placeholder="Max" min={140} max={220}
                        value={filters.height_max ?? ''}
                        onChange={e => onUpdate('height_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm" />
                </div>
            ))}

            {sec('Religion & Caste', (
                <div className="space-y-2">
                    <SearchableSelect id="sr-rel" options={toOpts(religionOpts)} value={filters.religion}
                        onChange={v => { onUpdate('religion', v ?? undefined); onUpdate('caste', undefined); }}
                        placeholder="Any religion…" />
                    {casteOpts.length > 0 && (
                        <SearchableSelect id="sr-cst" options={toOpts(casteOpts)} value={filters.caste}
                            onChange={v => onUpdate('caste', v ?? undefined)}
                            placeholder="Any caste…" />
                    )}
                </div>
            ))}

            {sec('Marital Status', (
                <SearchableSelect id="sr-ms" options={toOpts(maritalOpts)} value={filters.marital_status}
                    onChange={v => onUpdate('marital_status', v ?? undefined)} placeholder="Any status…" />
            ))}

            {sec('Has Children', (
                <SearchableSelect id="sr-hc" options={toOpts(haveChildrenOpts)} value={filters.has_children}
                    onChange={v => onUpdate('has_children', v ?? undefined)} placeholder="Any…" />
            ))}

            {sec('Location', (
                <div className="space-y-2">
                    <SearchableSelect id="sr-cnt" options={toOpts(countryOpts)} value={filters.country}
                        onChange={v => { onUpdate('country', v ?? undefined); onUpdate('state', undefined); onUpdate('city', undefined); }}
                        placeholder="Any country…" />
                    {stateOpts.length > 0 && isBangladesh && (
                        <SearchableSelect id="sr-bd-div" options={toOpts(stateOpts)} value={filters.city}
                            onChange={v => { onUpdate('city', v ?? undefined); onUpdate('state', undefined); }}
                            placeholder="Any division…" />
                    )}
                    {isBangladesh && bdDistrictOpts.length > 0 && (
                        <SearchableSelect id="sr-bd-dist" options={toOpts(bdDistrictOpts)} value={filters.state}
                            onChange={v => onUpdate('state', v ?? undefined)} placeholder="Any district / city…" />
                    )}
                    {stateOpts.length > 0 && !isBangladesh && (
                        <SearchableSelect id="sr-st" options={toOpts(stateOpts)} value={filters.state}
                            onChange={v => onUpdate('state', v ?? undefined)} placeholder="Any state / division…" />
                    )}
                    {!isBangladesh && !shouldHideCity && (
                        <Input placeholder="City (type to filter)" value={filters.city ?? ''}
                            onChange={e => onUpdate('city', e.target.value || undefined)}
                            className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm" />
                    )}
                    <SearchableSelect id="sr-nat" options={toOpts(nationalityOpts)} value={filters.nationality}
                        onChange={v => onUpdate('nationality', v ?? undefined)} placeholder="Nationality…" />
                    <SearchableSelect id="sr-rs" options={toOpts(residingStatusOpts)} value={filters.residing_status}
                        onChange={v => onUpdate('residing_status', v ?? undefined)} placeholder="Residing status…" />
                </div>
            ))}

            {sec('Education & Career', (
                <div className="space-y-2">
                    <SearchableSelect id="sr-edu" options={toOpts(educationOpts)} value={filters.education}
                        onChange={v => onUpdate('education', v ?? undefined)} placeholder="Education level…" />
                    <SearchableSelect id="sr-prf" options={toOpts(professionOpts)} value={filters.profession}
                        onChange={v => onUpdate('profession', v ?? undefined)} placeholder="Profession…" />
                    <SearchableSelect id="sr-emp" options={toOpts(employedInOpts)} value={filters.employed_in}
                        onChange={v => onUpdate('employed_in', v ?? undefined)} placeholder="Employed in…" />
                    <div>
                        <Label className="text-xs text-muted-foreground block mb-1">Annual Income (BDT)</Label>
                        <div className="flex items-center gap-2">
                            <select value={filters.income_min ?? ''}
                                onChange={e => onUpdate('income_min', e.target.value ? Number(e.target.value) : undefined)}
                                className="flex-1 border border-[var(--border)] bg-[var(--input)] rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground">
                                <option value="">Min</option>
                                {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <span className="text-muted-foreground text-xs">–</span>
                            <select value={filters.income_max ?? ''}
                                onChange={e => onUpdate('income_max', e.target.value ? Number(e.target.value) : undefined)}
                                className="flex-1 border border-[var(--border)] bg-[var(--input)] rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground">
                                <option value="">Max</option>
                                {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            ))}

            {sec('Physical', (
                <div className="space-y-2">
                    <SearchableSelect id="sr-bt" options={toOpts(bodyTypeOpts)} value={filters.body_type}
                        onChange={v => onUpdate('body_type', v ?? undefined)} placeholder="Body type…" />
                    <SearchableSelect id="sr-cx" options={toOpts(complexionOpts)} value={filters.complexion}
                        onChange={v => onUpdate('complexion', v ?? undefined)} placeholder="Complexion…" />
                    <SearchableSelect id="sr-bg" options={toOpts(bloodGroupOpts)} value={filters.blood_group}
                        onChange={v => onUpdate('blood_group', v ?? undefined)} placeholder="Blood group…" />
                    <SearchableSelect id="sr-mt" options={toOpts(motherTongueOpts)} value={filters.mother_tongue}
                        onChange={v => onUpdate('mother_tongue', v ?? undefined)} placeholder="Mother tongue…" />
                </div>
            ))}

            {sec('Lifestyle', (
                <div className="space-y-2">
                    <SearchableSelect id="sr-diet" options={toOpts(dietOpts)} value={filters.diet}
                        onChange={v => onUpdate('diet', v ?? undefined)} placeholder="Diet…" />
                    <SearchableSelect id="sr-smk" options={toOpts(smokingOpts)} value={filters.smoking}
                        onChange={v => onUpdate('smoking', v ?? undefined)} placeholder="Smoking…" />
                    <SearchableSelect id="sr-drk" options={toOpts(drinkingOpts)} value={filters.drinking}
                        onChange={v => onUpdate('drinking', v ?? undefined)} placeholder="Drinking…" />
                </div>
            ))}

            {sec('Find by Profile ID', (
                <Input placeholder="e.g. BON-001234" value={filters.profile_id ?? ''}
                    onChange={e => onUpdate('profile_id', e.target.value || undefined)}
                    className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm font-mono" />
            ))}

        </div>
    );
}

// ── Active filter badges ──────────────────────────────────────────────────────

const FILTER_LABELS: Partial<Record<keyof SearchFilters, string>> = {
    gender: 'Gender', age_min: 'Age ≥', age_max: 'Age ≤',
    height_min: 'Height ≥', height_max: 'Height ≤',
    religion: 'Religion', caste: 'Caste', marital_status: 'Marital',
    has_children: 'Children', body_type: 'Body', complexion: 'Complexion',
    blood_group: 'Blood', mother_tongue: 'Language',
    education: 'Education', profession: 'Profession', employed_in: 'Employed',
    income_min: 'Income ≥', income_max: 'Income ≤',
    country: 'Country', state: 'State', city: 'City',
    nationality: 'Nationality', residing_status: 'Residing',
    diet: 'Diet', smoking: 'Smoking', drinking: 'Drinking',
    profile_id: 'Profile ID',
};

function ActiveBadges({ filters, onRemove }: { filters: SearchFilters; onRemove: (key: keyof SearchFilters) => void }) {
    const skip = new Set<string>(['page', 'sort', 'query']);
    const entries = Object.entries(filters).filter(
        ([k, v]) => !skip.has(k) && v !== undefined && v !== ''
    ) as [keyof SearchFilters, unknown][];
    if (entries.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mb-4">
            {entries.map(([key, val]) => (
                <span key={key}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[var(--primary)]/40 bg-[var(--accent)] text-[var(--primary)] font-medium">
                    {FILTER_LABELS[key] ?? String(key)}: <span className="font-semibold">{String(val)}</span>
                    <button onClick={() => onRemove(key)} className="ml-0.5 hover:text-red-400 transition-colors">
                        <XIcon size={10} strokeWidth={3} />
                    </button>
                </span>
            ))}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
    const authUser = useAuthStore(s => s.user);
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalQuery, setGlobalQuery] = useState('');
    const [errorType, setErrorType] = useState<'permission' | 'search' | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initGenderRef = useRef(false);

    const handleGlobalSearch = useCallback((val: string) => {
        setGlobalQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedFilters(prev => ({ ...prev, query: val || undefined }));
            setPage(1);
        }, 420);
    }, []);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // First load should default to opposite gender results for the authenticated user.
    useEffect(() => {
        if (initGenderRef.current || !authUser?.gender) return;
        const opposite = authUser.gender === 'male' ? 'female' : 'male';
        setFilters(prev => ({ ...prev, gender: prev.gender ?? opposite }));
        setAppliedFilters(prev => ({ ...prev, gender: prev.gender ?? opposite }));
        initGenderRef.current = true;
    }, [authUser?.gender]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['search', appliedFilters, page],
        queryFn: () => matchService.search({ ...appliedFilters, page }).then(r => r.data),
        retry: false,
    });

    // Determine error type based on response status
    useEffect(() => {
        if (isError) {
            const errorResponse = error as any;
            const status = errorResponse?.response?.status;
            setErrorType(status === 403 ? 'permission' : 'search');
        } else {
            setErrorType(null);
        }
    }, [isError, error]);

    const paginatedData = data?.data as { data?: ProfileCard[]; total?: number; last_page?: number } | undefined;
    const results: ProfileCard[] = paginatedData?.data ?? [];
    const lastPage = paginatedData?.last_page ?? 1;
    const total = paginatedData?.total ?? 0;

    const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const removeFilter = useCallback((key: keyof SearchFilters) => {
        setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
        setAppliedFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
        setPage(1);
    }, []);

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters, query: globalQuery || undefined });
        setPage(1);
        setSidebarOpen(false);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters({ query: globalQuery || undefined });
        setPage(1);
    };

    const handleSortChange = (sort: string) => {
        setAppliedFilters(prev => ({ ...prev, sort: sort as SearchFilters['sort'] }));
        setPage(1);
    };

    const activeCount = countActiveFilters(appliedFilters);

    return (
        <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            {/* Top bar */}
            <div className="mb-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="page-title">Search Profiles</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {total > 0 ? `${total.toLocaleString()} profiles found` : 'Find your perfect match'}
                        </p>
                    </div>
                    <button onClick={() => setSidebarOpen(true)}
                        className="btn-gold md:hidden flex items-center gap-1.5 relative"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1rem', fontSize: '0.875rem' }}>
                        <FilterIcon size={14} strokeWidth={2} /> Filters
                        {activeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Global search bar */}
                <div className="relative">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                    <input
                        type="text"
                        value={globalQuery}
                        onChange={e => handleGlobalSearch(e.target.value)}
                        placeholder="Search by name, BON-ID, city, country, religion, profession, employer, about me…"
                        className="w-full h-11 pl-10 pr-10 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                    />
                    {globalQuery && (
                        <button onClick={() => handleGlobalSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            <XIcon size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-6">
                {/* Desktop sidebar */}
                <aside className="hidden md:block w-72 flex-shrink-0">
                    <div className="card-premium p-5 sticky top-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                                Filters
                                {activeCount > 0 && (
                                    <span className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">{activeCount}</span>
                                )}
                            </h2>
                        </div>
                        <FilterPanel filters={filters} onUpdate={updateFilter} onApply={handleApplyFilters} onClear={handleClearFilters} />
                    </div>
                </aside>

                {/* Mobile drawer */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="absolute right-0 top-0 bottom-0 w-80 bg-card shadow-2xl flex flex-col border-l border-[var(--border)]">
                            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
                                <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                                    Filters {activeCount > 0 && <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">{activeCount}</span>}
                                </h2>
                                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground p-1.5 hover:text-foreground rounded-lg hover:bg-[var(--muted)] transition-colors">
                                    <XIcon size={18} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <FilterPanel filters={filters} onUpdate={updateFilter} onApply={handleApplyFilters} onClear={handleClearFilters} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 min-w-0">
                    {/* Sort + badges row */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex-1 min-w-0">
                            <ActiveBadges filters={appliedFilters} onRemove={removeFilter} />
                        </div>
                        {!isLoading && results.length > 0 && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <label className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Sort:</label>
                                <select value={appliedFilters.sort ?? 'latest'}
                                    onChange={e => handleSortChange(e.target.value)}
                                    className="border border-[var(--border)] bg-[var(--input)] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground cursor-pointer">
                                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-gold aspect-[3/4] rounded-2xl" />)}
                        </div>
                    )}

                    {isError && (
                        <div className="card-premium p-12 text-center">
                            <p className="text-destructive font-medium">
                                {errorType === 'permission'
                                    ? 'Package needs to be upgraded to use this feature.'
                                    : 'Search failed. Please try again.'}
                            </p>
                        </div>
                    )}

                    {!isLoading && !isError && results.length === 0 && (
                        <div className="card-premium p-16 text-center animate-fade-in-up">
                            <SearchIcon size={52} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>No profiles found</p>
                            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search term</p>
                            {activeCount > 0 && (
                                <button onClick={handleClearFilters} className="btn-outline-gold mt-5"
                                    style={{ height: '2.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', padding: '0 1.25rem' }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                                {results.map(profile => <MatchCard key={profile.id} profile={profile} showScore={false} />)}
                            </div>

                            {lastPage > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="btn-page disabled:opacity-40 disabled:cursor-not-allowed">
                                        <ArrowLeftIcon size={14} strokeWidth={2} /> Prev
                                    </button>

                                    {Array.from({ length: lastPage }, (_, i) => i + 1)
                                        .filter(n => n === 1 || n === lastPage || Math.abs(n - page) <= 2)
                                        .reduce<(number | '…')[]>((acc, n, i, arr) => {
                                            if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                                            acc.push(n); return acc;
                                        }, [])
                                        .map((item, idx) =>
                                            item === '…'
                                                ? <span key={`e${idx}`} className="text-muted-foreground text-sm px-1">…</span>
                                                : <button key={item} onClick={() => setPage(item as number)}
                                                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all border ${
                                                        page === item
                                                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                                                            : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/50 hover:text-foreground'
                                                    }`}>{item}</button>
                                        )
                                    }

                                    <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                                        className="btn-page disabled:opacity-40 disabled:cursor-not-allowed">
                                        Next <ArrowRightIcon size={14} strokeWidth={2} />
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

