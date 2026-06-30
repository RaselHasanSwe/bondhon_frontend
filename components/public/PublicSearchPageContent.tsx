'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { publicSearchService, type PublicSearchFilters } from '@/services/publicSearchService';
import { PublicProfileCard } from '@/components/match/PublicProfileCard';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { usePublicInfiniteList } from '@/hooks/usePublicInfiniteList';
import { normalizeMetaPage } from '@/lib/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
    useOptionsBulk,
    useChildOptions,
    pickOptions,
    SEARCH_FILTER_OPTION_GROUPS,
} from '@/hooks/useSelectOptions';
import { SearchIcon, FilterIcon, XIcon } from '@/components/ui/icons';

const INCOME_OPTIONS = [
    { value: '100000', label: '1 Lakh+' },
    { value: '300000', label: '3 Lakh+' },
    { value: '500000', label: '5 Lakh+' },
    { value: '1000000', label: '10 Lakh+' },
    { value: '2000000', label: '20 Lakh+' },
    { value: '5000000', label: '50 Lakh+' },
];

const SORT_OPTIONS = [
    { value: 'latest', label: 'Newest Members' },
    { value: 'age_asc', label: 'Age: Youngest First' },
    { value: 'age_desc', label: 'Age: Oldest First' },
    { value: 'completion', label: 'Profile Completeness' },
];

const DEFAULT_FILTERS: PublicSearchFilters = {};

function countActiveFilters(f: PublicSearchFilters): number {
    const skip = new Set(['page', 'sort', 'query']);
    return Object.entries(f).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== '' && v !== null).length;
}

function toOpts(items: { value: string; label: string }[]) {
    return items;
}

function parseUrlFilters(params: URLSearchParams): PublicSearchFilters {
    const filters: PublicSearchFilters = {};
    const gender = params.get('gender');
    if (gender === 'male' || gender === 'female') filters.gender = gender;

    const ageMin = params.get('age_min');
    if (ageMin) filters.age_min = Number(ageMin);
    const ageMax = params.get('age_max');
    if (ageMax) filters.age_max = Number(ageMax);

    const religion = params.get('religion');
    if (religion) filters.religion = religion;

    const query = params.get('query');
    if (query) filters.query = query;

    return filters;
}

interface FilterPanelProps {
    filters: PublicSearchFilters;
    onUpdate: <K extends keyof PublicSearchFilters>(key: K, val: PublicSearchFilters[K]) => void;
    onApply: () => void;
    onClear: () => void;
}

function FilterPanel({ filters, onUpdate, onApply, onClear }: FilterPanelProps) {
    const { data: bulkOptions } = useOptionsBulk(SEARCH_FILTER_OPTION_GROUPS);

    const religionOpts = pickOptions(bulkOptions, 'religion');
    const maritalOpts = pickOptions(bulkOptions, 'marital_status');
    const educationOpts = pickOptions(bulkOptions, 'education_level');
    const professionOpts = pickOptions(bulkOptions, 'profession');
    const employedInOpts = pickOptions(bulkOptions, 'employed_in');
    const dietOpts = pickOptions(bulkOptions, 'diet');
    const smokingOpts = pickOptions(bulkOptions, 'smoking');
    const drinkingOpts = pickOptions(bulkOptions, 'drinking');
    const bodyTypeOpts = pickOptions(bulkOptions, 'body_type');
    const complexionOpts = pickOptions(bulkOptions, 'complexion');
    const bloodGroupOpts = pickOptions(bulkOptions, 'blood_group');
    const motherTongueOpts = pickOptions(bulkOptions, 'mother_tongue');
    const nationalityOpts = pickOptions(bulkOptions, 'nationality');
    const countryOpts = pickOptions(bulkOptions, 'country');
    const residingStatusOpts = pickOptions(bulkOptions, 'residing_status');
    const haveChildrenOpts = pickOptions(bulkOptions, 'have_children');

    const selectedReligionId = religionOpts.find((o) => o.value === filters.religion)?.id;
    const { data: casteOpts = [] } = useChildOptions('caste', selectedReligionId);

    const selectedCountryId = countryOpts.find((o) => o.value === filters.country)?.id;
    const { data: stateOpts = [] } = useChildOptions('country', selectedCountryId);
    const isBangladesh = filters.country === 'bangladesh';
    const selectedBdDivisionId = stateOpts.find((o) => o.value === filters.city)?.id;
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
                    <button
                        onClick={onApply}
                        className="btn-gold flex-1"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', fontSize: '0.842rem' }}
                    >
                        Apply
                    </button>
                    <button
                        onClick={onClear}
                        className="btn-outline-gold px-4"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {sec(
                'Gender',
                <div className="flex gap-2">
                    {(['male', 'female'] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => onUpdate('gender', filters.gender === g ? undefined : g)}
                            className={`flex-1 py-1.5 rounded-xl border text-sm capitalize transition-all ${
                                filters.gender === g
                                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)] font-semibold'
                                    : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/50'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>,
            )}

            {sec(
                'Age Range',
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Min"
                        min={18}
                        max={100}
                        value={filters.age_min ?? ''}
                        onChange={(e) => onUpdate('age_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm"
                    />
                    <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        min={18}
                        max={100}
                        value={filters.age_max ?? ''}
                        onChange={(e) => onUpdate('age_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm"
                    />
                </div>,
            )}

            {sec(
                'Height (cm)',
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Min"
                        min={140}
                        max={220}
                        value={filters.height_min ?? ''}
                        onChange={(e) => onUpdate('height_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm"
                    />
                    <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        min={140}
                        max={220}
                        value={filters.height_max ?? ''}
                        onChange={(e) => onUpdate('height_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm"
                    />
                </div>,
            )}

            {sec(
                'Religion & Caste',
                <div className="space-y-2">
                    <SearchableSelect
                        id="psr-rel"
                        options={toOpts(religionOpts)}
                        value={filters.religion}
                        onChange={(v) => {
                            onUpdate('religion', v ?? undefined);
                            onUpdate('caste', undefined);
                        }}
                        placeholder="Any religion…"
                    />
                    {casteOpts.length > 0 && (
                        <SearchableSelect
                            id="psr-cst"
                            options={toOpts(casteOpts)}
                            value={filters.caste}
                            onChange={(v) => onUpdate('caste', v ?? undefined)}
                            placeholder="Any caste…"
                        />
                    )}
                </div>,
            )}

            {sec(
                'Marital Status',
                <SearchableSelect
                    id="psr-ms"
                    options={toOpts(maritalOpts)}
                    value={filters.marital_status}
                    onChange={(v) => onUpdate('marital_status', v ?? undefined)}
                    placeholder="Any status…"
                />,
            )}

            {sec(
                'Has Children',
                <SearchableSelect
                    id="psr-hc"
                    options={toOpts(haveChildrenOpts)}
                    value={filters.has_children}
                    onChange={(v) => onUpdate('has_children', v ?? undefined)}
                    placeholder="Any…"
                />,
            )}

            {sec(
                'Location',
                <div className="space-y-2">
                    <SearchableSelect
                        id="psr-cnt"
                        options={toOpts(countryOpts)}
                        value={filters.country}
                        onChange={(v) => {
                            onUpdate('country', v ?? undefined);
                            onUpdate('state', undefined);
                            onUpdate('city', undefined);
                        }}
                        placeholder="Any country…"
                    />
                    {stateOpts.length > 0 && isBangladesh && (
                        <SearchableSelect
                            id="psr-bd-div"
                            options={toOpts(stateOpts)}
                            value={filters.city}
                            onChange={(v) => {
                                onUpdate('city', v ?? undefined);
                                onUpdate('state', undefined);
                            }}
                            placeholder="Any division…"
                        />
                    )}
                    {isBangladesh && bdDistrictOpts.length > 0 && (
                        <SearchableSelect
                            id="psr-bd-dist"
                            options={toOpts(bdDistrictOpts)}
                            value={filters.state}
                            onChange={(v) => onUpdate('state', v ?? undefined)}
                            placeholder="Any district / city…"
                        />
                    )}
                    {stateOpts.length > 0 && !isBangladesh && (
                        <SearchableSelect
                            id="psr-st"
                            options={toOpts(stateOpts)}
                            value={filters.state}
                            onChange={(v) => onUpdate('state', v ?? undefined)}
                            placeholder="Any state / division…"
                        />
                    )}
                    {!isBangladesh && !shouldHideCity && (
                        <Input
                            placeholder="City (type to filter)"
                            value={filters.city ?? ''}
                            onChange={(e) => onUpdate('city', e.target.value || undefined)}
                            className="h-9 rounded-xl border-[var(--border)] bg-[var(--input)] text-sm"
                        />
                    )}
                    <SearchableSelect
                        id="psr-nat"
                        options={toOpts(nationalityOpts)}
                        value={filters.nationality}
                        onChange={(v) => onUpdate('nationality', v ?? undefined)}
                        placeholder="Nationality…"
                    />
                    <SearchableSelect
                        id="psr-rs"
                        options={toOpts(residingStatusOpts)}
                        value={filters.residing_status}
                        onChange={(v) => onUpdate('residing_status', v ?? undefined)}
                        placeholder="Residing status…"
                    />
                </div>,
            )}

            {sec(
                'Education & Career',
                <div className="space-y-2">
                    <SearchableSelect
                        id="psr-edu"
                        options={toOpts(educationOpts)}
                        value={filters.education}
                        onChange={(v) => onUpdate('education', v ?? undefined)}
                        placeholder="Education level…"
                    />
                    <SearchableSelect
                        id="psr-prf"
                        options={toOpts(professionOpts)}
                        value={filters.profession}
                        onChange={(v) => onUpdate('profession', v ?? undefined)}
                        placeholder="Profession…"
                    />
                    <SearchableSelect
                        id="psr-emp"
                        options={toOpts(employedInOpts)}
                        value={filters.employed_in}
                        onChange={(v) => onUpdate('employed_in', v ?? undefined)}
                        placeholder="Employed in…"
                    />
                    <div>
                        <Label className="text-xs text-muted-foreground block mb-1">Annual Income (BDT)</Label>
                        <div className="flex items-center gap-2">
                            <select
                                value={filters.income_min ?? ''}
                                onChange={(e) =>
                                    onUpdate('income_min', e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="flex-1 border border-[var(--border)] bg-[var(--input)] rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground"
                            >
                                <option value="">Min</option>
                                {INCOME_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <span className="text-muted-foreground text-xs">–</span>
                            <select
                                value={filters.income_max ?? ''}
                                onChange={(e) =>
                                    onUpdate('income_max', e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="flex-1 border border-[var(--border)] bg-[var(--input)] rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground"
                            >
                                <option value="">Max</option>
                                {INCOME_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>,
            )}

            {sec(
                'Physical',
                <div className="space-y-2">
                    <SearchableSelect
                        id="psr-bt"
                        options={toOpts(bodyTypeOpts)}
                        value={filters.body_type}
                        onChange={(v) => onUpdate('body_type', v ?? undefined)}
                        placeholder="Body type…"
                    />
                    <SearchableSelect
                        id="psr-cx"
                        options={toOpts(complexionOpts)}
                        value={filters.complexion}
                        onChange={(v) => onUpdate('complexion', v ?? undefined)}
                        placeholder="Complexion…"
                    />
                    <SearchableSelect
                        id="psr-bg"
                        options={toOpts(bloodGroupOpts)}
                        value={filters.blood_group}
                        onChange={(v) => onUpdate('blood_group', v ?? undefined)}
                        placeholder="Blood group…"
                    />
                    <SearchableSelect
                        id="psr-mt"
                        options={toOpts(motherTongueOpts)}
                        value={filters.mother_tongue}
                        onChange={(v) => onUpdate('mother_tongue', v ?? undefined)}
                        placeholder="Mother tongue…"
                    />
                </div>,
            )}

            {sec(
                'Lifestyle',
                <div className="space-y-2">
                    <SearchableSelect
                        id="psr-diet"
                        options={toOpts(dietOpts)}
                        value={filters.diet}
                        onChange={(v) => onUpdate('diet', v ?? undefined)}
                        placeholder="Diet…"
                    />
                    <SearchableSelect
                        id="psr-smk"
                        options={toOpts(smokingOpts)}
                        value={filters.smoking}
                        onChange={(v) => onUpdate('smoking', v ?? undefined)}
                        placeholder="Smoking…"
                    />
                    <SearchableSelect
                        id="psr-drk"
                        options={toOpts(drinkingOpts)}
                        value={filters.drinking}
                        onChange={(v) => onUpdate('drinking', v ?? undefined)}
                        placeholder="Drinking…"
                    />
                </div>,
            )}
        </div>
    );
}

const FILTER_LABELS: Partial<Record<keyof PublicSearchFilters, string>> = {
    gender: 'Gender',
    age_min: 'Age ≥',
    age_max: 'Age ≤',
    height_min: 'Height ≥',
    height_max: 'Height ≤',
    religion: 'Religion',
    caste: 'Caste',
    marital_status: 'Marital',
    has_children: 'Children',
    body_type: 'Body',
    complexion: 'Complexion',
    blood_group: 'Blood',
    mother_tongue: 'Language',
    education: 'Education',
    profession: 'Profession',
    employed_in: 'Employed',
    income_min: 'Income ≥',
    income_max: 'Income ≤',
    country: 'Country',
    state: 'State',
    city: 'City',
    nationality: 'Nationality',
    residing_status: 'Residing',
    diet: 'Diet',
    smoking: 'Smoking',
    drinking: 'Drinking',
};

function ActiveBadges({
    filters,
    onRemove,
}: {
    filters: PublicSearchFilters;
    onRemove: (key: keyof PublicSearchFilters) => void;
}) {
    const skip = new Set<string>(['page', 'sort', 'query']);
    const entries = Object.entries(filters).filter(
        ([k, v]) => !skip.has(k) && v !== undefined && v !== '',
    ) as [keyof PublicSearchFilters, unknown][];
    if (entries.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mb-4">
            {entries.map(([key, val]) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[var(--primary)]/40 bg-[var(--accent)] text-[var(--primary)] font-medium"
                >
                    {FILTER_LABELS[key] ?? String(key)}: <span className="font-semibold">{String(val)}</span>
                    <button onClick={() => onRemove(key)} className="ml-0.5 hover:text-red-400 transition-colors">
                        <XIcon size={10} strokeWidth={3} />
                    </button>
                </span>
            ))}
        </div>
    );
}

export default function PublicSearchPageContent() {
    const searchParams = useSearchParams();
    const urlInitRef = useRef(false);

    const [filters, setFilters] = useState<PublicSearchFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<PublicSearchFilters>(DEFAULT_FILTERS);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalQuery, setGlobalQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (urlInitRef.current) return;
        const initial = parseUrlFilters(searchParams);
        if (Object.keys(initial).length > 0) {
            setFilters(initial);
            setAppliedFilters(initial);
            if (initial.query) setGlobalQuery(initial.query);
        }
        urlInitRef.current = true;
    }, [searchParams]);

    const handleGlobalSearch = useCallback((val: string) => {
        setGlobalQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedFilters((prev) => ({ ...prev, query: val || undefined }));
        }, 420);
    }, []);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const {
        items: results,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = usePublicInfiniteList({
        queryKey: ['search', appliedFilters],
        queryFn: (page) =>
            publicSearchService.search({ ...appliedFilters, page }).then((r) => normalizeMetaPage(r.data.data, page)),
        retry: false,
    });

    const updateFilter = useCallback(<K extends keyof PublicSearchFilters>(key: K, value: PublicSearchFilters[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const removeFilter = useCallback((key: keyof PublicSearchFilters) => {
        setFilters((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
        });
        setAppliedFilters((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
        });
    }, []);

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters, query: globalQuery || undefined });
        setSidebarOpen(false);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters({ query: globalQuery || undefined });
    };

    const handleSortChange = (sort: string) => {
        setAppliedFilters((prev) => ({ ...prev, sort: sort as PublicSearchFilters['sort'] }));
    };

    const activeCount = countActiveFilters(appliedFilters);

    return (
        <>
            <div className="py-10" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1
                        className="text-3xl md:text-4xl font-bold text-white"
                        style={{ fontFamily: 'var(--font-heading, serif)' }}
                    >
                        Search Profiles
                    </h1>
                    <p className="text-gray-400 mt-3 text-sm md:text-base">
                        Browse verified matrimony profiles. Sign up free to view full details and connect.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="mb-5 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {total > 0 ? `${total.toLocaleString()} profiles found` : 'Find your perfect match'}
                            </p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="btn-gold md:hidden flex items-center gap-1.5 relative"
                            style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1rem', fontSize: '0.875rem' }}
                        >
                            <FilterIcon size={14} strokeWidth={2} /> Filters
                            {activeCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <SearchIcon
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            strokeWidth={2}
                        />
                        <input
                            type="text"
                            value={globalQuery}
                            onChange={(e) => handleGlobalSearch(e.target.value)}
                            placeholder="Search by name, city, country, religion, profession…"
                            className="w-full h-11 pl-10 pr-10 border border-[var(--border)] bg-white rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                        />
                        {globalQuery && (
                            <button
                                onClick={() => handleGlobalSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <XIcon size={14} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-6">
                    <aside className="hidden md:block w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-6 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                                    Filters
                                    {activeCount > 0 && (
                                        <span className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">
                                            {activeCount}
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <FilterPanel
                                filters={filters}
                                onUpdate={updateFilter}
                                onApply={handleApplyFilters}
                                onClear={handleClearFilters}
                            />
                        </div>
                    </aside>

                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-80 bg-card shadow-2xl flex flex-col border-l border-[var(--border)]">
                                <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
                                    <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                                        Filters{' '}
                                        {activeCount > 0 && (
                                            <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">
                                                {activeCount}
                                            </span>
                                        )}
                                    </h2>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="text-muted-foreground p-1.5 hover:text-foreground rounded-lg hover:bg-[var(--muted)] transition-colors"
                                    >
                                        <XIcon size={18} strokeWidth={2} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5">
                                    <FilterPanel
                                        filters={filters}
                                        onUpdate={updateFilter}
                                        onApply={handleApplyFilters}
                                        onClear={handleClearFilters}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3 gap-3">
                            <div className="flex-1 min-w-0">
                                <ActiveBadges filters={appliedFilters} onRemove={removeFilter} />
                            </div>
                            {!isLoading && results.length > 0 && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                                        Sort:
                                    </label>
                                    <select
                                        value={appliedFilters.sort ?? 'latest'}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="border border-[var(--border)] bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground cursor-pointer"
                                    >
                                        {SORT_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {isLoading && (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="skeleton-gold aspect-[3/4] rounded-2xl" />
                                ))}
                            </div>
                        )}

                        {isError && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                                <p className="text-destructive font-medium">Search failed. Please try again.</p>
                            </div>
                        )}

                        {!isLoading && !isError && results.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center animate-fade-in-up shadow-sm">
                                <SearchIcon size={52} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                                <p
                                    className="text-lg font-semibold text-foreground"
                                    style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                    No profiles found
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search term</p>
                                {activeCount > 0 && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="btn-outline-gold mt-5"
                                        style={{
                                            height: '2.25rem',
                                            borderRadius: '0.75rem',
                                            fontSize: '0.875rem',
                                            padding: '0 1.25rem',
                                        }}
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                                    {results.map((profile) => (
                                        <PublicProfileCard key={profile.id} profile={profile} />
                                    ))}
                                </div>

                                <InfiniteScrollFooter
                                    hasNextPage={!!hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    onLoadMore={() => fetchNextPage()}
                                    showEndMessage={results.length > 0}
                                    endMessage="No more profiles to show"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
