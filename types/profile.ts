export interface ProfileData {
    profile_id: string;
    dob: string | null;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    complexion: 'very_fair' | 'fair' | 'wheatish' | 'dark' | null;
    blood_group: string | null;
    marital_status: 'never_married' | 'divorced' | 'widowed' | 'awaiting_divorce' | null;
    mother_tongue: string | null;
    nationality: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    about_me: string | null;
    profile_completion_percentage: number;
    is_verified: boolean;
    is_photo_approved: boolean;
    last_seen_at: string | null;
    privacy_settings: PrivacySettings | null;
}

export interface PrivacySettings {
    show_photo_to: 'all' | 'connections_only' | 'none';
    show_phone_to: 'connections_only' | 'none';
    show_email_to: 'none';
    hide_profile_from: number[];
    show_online_status: boolean;
}

export interface ReligiousDetail {
    religion: string | null;
    caste: string | null;
    sub_caste: string | null;
    gotra: string | null;
    manglik_status: 'yes' | 'no' | 'partial' | 'dont_know' | null;
}

export interface FamilyDetail {
    family_type: 'joint' | 'nuclear' | 'extended' | null;
    family_status: 'middle_class' | 'upper_middle_class' | 'rich' | 'affluent' | null;
    family_income_bdt_per_month: number | null;
    father_occupation: string | null;
    mother_occupation: string | null;
    brothers_count: number;
    sisters_count: number;
}

export interface EducationCareer {
    highest_education: string | null;
    college_university: string | null;
    profession: string | null;
    employed_in: 'private' | 'government' | 'business' | 'self_employed' | 'not_working' | null;
    annual_income_bdt: number | null;
}

export interface Lifestyle {
    diet: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain' | null;
    smoking: 'non_smoker' | 'smoker' | 'occasionally' | null;
    drinking: 'non_drinker' | 'drinker' | 'occasionally' | null;
    hobbies: string[] | null;
    languages_known: string[];
}

export interface HoroscopeDetail {
    birth_place: string | null;
    birth_time: string | null;
    rashi: string | null;
    nakshatra: string | null;
    manglik: boolean | null;
}

export interface PartnerPreference {
    age_min: number | null;
    age_max: number | null;
    height_min_cm: number | null;
    height_max_cm: number | null;
    marital_status: string[] | null;
    religion: string[] | null;
    caste: string[] | null;
    education: string[] | null;
    profession: string[] | null;
    income_min_bdt: number | null;
    income_max_bdt: number | null;
    country: string[] | null;
    city: string[] | null;
    diet: string[] | null;
    smoking_acceptable: boolean;
    drinking_acceptable: boolean;
}

export interface ProfilePhoto {
    id: number;
    file_path: string;
    is_primary: boolean;
    is_approved: boolean;
    is_private: boolean;
    moderation_status: 'pending' | 'approved' | 'rejected';
}

export interface ProfileCard {
    id: number;
    name: string;
    gender: 'male' | 'female';
    subscription_plan: string;
    profile: {
        profile_id: string;
        dob: string | null;
        age: number | null;
        height_cm: number | null;
        marital_status: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        is_verified: boolean;
        last_seen_at: string | null;
        profile_completion_percentage: number;
    } | null;
    religion: string | null;
    caste: string | null;
    education: string | null;
    profession: string | null;
    diet: string | null;
    primary_photo: string | null;
}

export interface FullProfile {
    id: number;
    name: string;
    gender: 'male' | 'female';
    profile: ProfileData | null;
    religious_detail: ReligiousDetail | null;
    family_detail: FamilyDetail | null;
    education_career: EducationCareer | null;
    lifestyle: Lifestyle | null;
    horoscope_detail: HoroscopeDetail | null;
    partner_preference: PartnerPreference | null;
    photos: ProfilePhoto[];
}

