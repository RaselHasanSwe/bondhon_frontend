'use client';

import ReactSelect, {
    StylesConfig,
    GroupBase,
} from 'react-select';
import { type SelectOption } from '@/lib/profileOptions';

/** Read a CSS variable from :root at runtime so portal-mounted menus get the
 *  actual colour even though they are outside the component tree.
 *
 *  NOTE: In this project the CSS variables store complete hex/color values
 *  (e.g. `--card: #FFFFFF`) so we return the value as-is — no hsl() wrapping. */
function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return val || fallback;
}

const PRIMARY = '#C9A227';

function buildStyles(isMulti = false): StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> {
    // Resolved at call-time so dark/light mode changes are picked up
    const bg        = cssVar('--input',            '#ffffff');
    const border    = cssVar('--border',           '#e2e8f0');
    const fg        = cssVar('--foreground',       '#0f172a');
    const muted     = cssVar('--muted-foreground', '#94a3b8');
    // For the detached portal menu we want a fully opaque surface colour.
    // Prefer --popover (shadcn defines it), fall back to --card, then white.
    const menuBg    = cssVar('--popover',  cssVar('--card', '#ffffff'));

    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: bg,
            borderColor: state.isFocused ? PRIMARY : border,
            borderRadius: '0.5rem',
            // Single: fixed h-8 to match Input; Multi: auto height for tag wrapping
            minHeight: '2rem',
            height: isMulti ? 'auto' : '2rem',
            boxShadow: state.isFocused ? `0 0 0 3px ${PRIMARY}50` : 'none',
            cursor: 'pointer',
            '&:hover': { borderColor: PRIMARY },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: isMulti ? '0.25rem 0.625rem' : '0 0.625rem',
            flexWrap: isMulti ? ('wrap' as const) : ('nowrap' as const),
        }),
        input: (base) => ({
            ...base,
            color: fg,
            margin: 0,
            padding: 0,
        }),
        singleValue: (base) => ({
            ...base,
            color: fg,
            fontSize: '0.875rem',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: `${PRIMARY}22`,
            borderRadius: '0.5rem',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: fg,
            fontSize: '0.8rem',
            fontWeight: 500,
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: fg,
            borderRadius: '0 0.5rem 0.5rem 0',
            '&:hover': { backgroundColor: `${PRIMARY}50`, color: fg },
        }),
        placeholder: (base) => ({
            ...base,
            color: muted,
            fontSize: '0.875rem',
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: muted,
            padding: '0 0.375rem',
            '&:hover': { color: fg },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: muted,
            padding: '0 0.25rem',
            '&:hover': { color: fg },
        }),
        indicatorSeparator: () => ({ display: 'none' }),

        /* ── Portal wrapper ─────────────────────────────────── */
        menuPortal: (base) => ({
            ...base,
            zIndex: 99999,
        }),

        /* ── Dropdown container ─────────────────────────────── */
        menu: (base) => ({
            ...base,
            /* Force a fully opaque background — CSS vars can be transparent
               inside the detached portal node. */
            backgroundColor: menuBg,
            opacity: 1,
            border: `1px solid ${border}`,
            borderRadius: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            zIndex: 99999,
            // Prevent any parent transparency bleeding through
            isolation: 'isolate',
        }),

        menuList: (base) => ({
            ...base,
            padding: '0.25rem',
            maxHeight: '240px',
            backgroundColor: menuBg,  // repeat so the scrollable list is opaque too
        }),

        /* ── Individual options ─────────────────────────────── */
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? PRIMARY
                : state.isFocused
                    ? `${PRIMARY}18`
                    : menuBg,          // opaque base colour — never transparent
            color: state.isSelected ? '#ffffff' : fg,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            '&:active': { backgroundColor: `${PRIMARY}35` },
        }),

        noOptionsMessage: (base) => ({
            ...base,
            color: muted,
            fontSize: '0.875rem',
            backgroundColor: menuBg,
        }),
    };
}

// ─── Single-value Searchable Select ──────────────────────────────────────────

interface SearchableSelectProps {
    options: SelectOption[];
    value: string | null | undefined;
    onChange: (value: string | null) => void;
    placeholder?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    id?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select…',
    isClearable = true,
    isDisabled = false,
    id,
}: SearchableSelectProps) {
    const selected = value ? (options.find(o => o.value === value) ?? null) : null;

    return (
        <ReactSelect<SelectOption>
            instanceId={id}
            options={options}
            value={selected}
            onChange={(opt) => onChange(opt ? opt.value : null)}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={isDisabled}
            styles={buildStyles()}
            classNamePrefix="rs"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuPosition="fixed"
            menuPlacement="auto"
        />
    );
}

// ─── Multi-value Searchable Select ────────────────────────────────────────────

interface MultiSelectProps {
    options: SelectOption[];
    value: string[] | null | undefined;
    onChange: (values: string[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    id?: string;
}

export function MultiSearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select one or more…',
    isDisabled = false,
    id,
}: MultiSelectProps) {
    const selected = (value ?? [])
        .map(v => options.find(o => o.value === v) ?? { value: v, label: v });

    return (
        <ReactSelect<SelectOption, true>
            instanceId={id}
            isMulti
            options={options}
            value={selected}
            onChange={(opts) => onChange(opts ? opts.map(o => o.value) : [])}
            placeholder={placeholder}
            isDisabled={isDisabled}
            styles={buildStyles(true) as StylesConfig<SelectOption, true, GroupBase<SelectOption>>}
            classNamePrefix="rs"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuPosition="fixed"
            menuPlacement="auto"
            closeMenuOnSelect={false}
        />
    );
}
