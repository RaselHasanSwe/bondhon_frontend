export interface PublicProfileCard {
    id: number;
    name: string;
    profile: {
        dob?: string | null;
        age?: number | null;
        height_cm?: number | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
    } | null;
    primary_photo?: string | null;
}
