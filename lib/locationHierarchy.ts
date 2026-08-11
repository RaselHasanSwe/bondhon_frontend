import type { OptionItem } from '@/hooks/useSelectOptions';

export type LocationHierarchyType =
    | 'division_district_upazila'
    | 'state_city'
    | 'flat_region_city'
    | 'region_city';

export type LocationMetadata = {
    hierarchy_type?: LocationHierarchyType;
    level_2_label?: string;
    level_3_label?: string;
    level_4_label?: string;
    field_map?: Record<string, string>;
};

export function getLocationMetadata(option?: OptionItem): LocationMetadata {
    return (option?.metadata ?? {}) as LocationMetadata;
}

export function getHierarchyType(option?: OptionItem): LocationHierarchyType | undefined {
    return getLocationMetadata(option).hierarchy_type;
}

export function getLevelLabel(metadata: LocationMetadata, level: 2 | 3 | 4, fallback: string): string {
    if (level === 2) return metadata.level_2_label ?? fallback;
    if (level === 3) return metadata.level_3_label ?? fallback;
    return metadata.level_4_label ?? fallback;
}

export function usesDivisionDistrictUpazila(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'division_district_upazila';
}

export function usesRegionCity(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'region_city';
}

export function usesFlatRegionCity(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'flat_region_city';
}

export function usesStateCity(option?: OptionItem): boolean {
    const type = getHierarchyType(option);
    return type === 'state_city' || type === 'flat_region_city';
}

/** Which form field stores level-2 selection for the current hierarchy. */
export function level2Field(option?: OptionItem): 'city' | 'state' {
    if (usesDivisionDistrictUpazila(option)) return 'city';
    return 'state';
}

/** Which form field stores level-3 selection. */
export function level3Field(option?: OptionItem): 'state' | 'city' | null {
    if (usesDivisionDistrictUpazila(option)) return 'state';
    if (usesRegionCity(option)) return 'city';
    return null;
}

/** Read the watched value that drives level-3 child options. */
export function level2ValueForChildren(
    option: OptionItem | undefined,
    city: string | undefined,
    state: string | undefined,
): string | undefined {
    return level2Field(option) === 'city' ? city : state;
}

/** Read the watched value that drives level-4 child options (Bangladesh only). */
export function level3ValueForChildren(
    option: OptionItem | undefined,
    state: string | undefined,
): string | undefined {
    return usesDivisionDistrictUpazila(option) ? state : undefined;
}

export function clearLocationFields(
    setValue: (name: 'country' | 'city' | 'state' | 'upazila', value: string) => void,
): void {
    setValue('city', '');
    setValue('state', '');
    setValue('upazila', '');
}
