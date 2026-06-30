export interface PublicProfileCard {
    id: number;
    name: string;
    profile: {
        profile_id?: string | null;
        dob?: string | null;
        age?: number | null;
        height_cm?: number | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
    } | null;
    profession?: string | null;
    is_verified?: boolean;
    primary_photo?: string | null;
}
