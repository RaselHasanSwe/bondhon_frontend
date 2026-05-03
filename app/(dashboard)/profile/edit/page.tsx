'use client';

import {useState, useEffect, useRef, Suspense} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useSearchParams} from 'next/navigation';
import {profileService} from '@/services/profileService';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {ProfileCompletionBar} from '@/components/profile/ProfileCompletionBar';
import type {ProfilePhoto} from '@/types/profile';

// Fields that use <select> with enum values — empty string means "not selected"
// and must NOT be sent to the backend (would fail `in:` validation).
const ENUM_FIELDS = new Set([
    'marital_status', 'manglik_status', 'employed_in',
    'diet', 'smoking', 'drinking',
    'family_type', 'family_status',
    'complexion', 'blood_group',   // basic info enums
]);

const basicSchema = z.object({
    dob: z.string().min(1, 'Date of birth is required'),
    height_cm: z.string().optional(),
    weight_kg: z.string().optional(),
    complexion: z.string().optional(),
    blood_group: z.string().optional(),
    marital_status: z.string().optional(),
    mother_tongue: z.string().max(100).optional(),
    nationality: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    about_me: z.string().max(2000).optional(),
});

const religiousSchema = z.object({
    religion: z.string().max(100).optional(),
    caste: z.string().max(100).optional(),
    sub_caste: z.string().max(100).optional(),
    gotra: z.string().max(100).optional(),
    manglik_status: z.string().optional(),
});

const educationSchema = z.object({
    highest_education: z.string().optional(),
    college_university: z.string().max(200).optional(),
    profession: z.string().max(100).optional(),
    employed_in: z.string().optional(),
    annual_income_bdt: z.string().optional(),
});

const lifestyleSchema = z.object({
    diet: z.string().optional(),
    smoking: z.string().optional(),
    drinking: z.string().optional(),
});

const familySchema = z.object({
    family_type: z.string().optional(),
    family_status: z.string().optional(),
    family_income_bdt_per_month: z.string().optional(),
    father_occupation: z.string().max(200).optional(),
    mother_occupation: z.string().max(200).optional(),
    brothers_count: z.string().optional(),
    sisters_count: z.string().optional(),
});

const horoscopeSchema = z.object({
    birth_place: z.string().max(200).optional(),
    birth_time: z.string().optional(),
    rashi: z.string().max(100).optional(),
    nakshatra: z.string().max(100).optional(),
    manglik: z.boolean().optional(),
});

const preferencesSchema = z.object({
    age_min: z.string().optional(),
    age_max: z.string().optional(),
    height_min_cm: z.string().optional(),
    height_max_cm: z.string().optional(),
    // checkbox arrays — backend validates these as strict enums
    pref_marital_status: z.array(z.string()).optional(),
    pref_diet: z.array(z.string()).optional(),
    pref_education: z.array(z.string()).optional(),
    // free-text comma-separated (no strict enum on backend)
    pref_religion: z.string().optional(),
    pref_caste: z.string().optional(),
    pref_profession: z.string().optional(),
    income_min_bdt: z.string().optional(),
    income_max_bdt: z.string().optional(),
    pref_country: z.string().optional(),
    pref_city: z.string().optional(),
    smoking_acceptable: z.boolean().optional(),
    drinking_acceptable: z.boolean().optional(),
});

type BasicForm = z.infer<typeof basicSchema>;
type ReligiousForm = z.infer<typeof religiousSchema>;
type EducationForm = z.infer<typeof educationSchema>;
type LifestyleForm = z.infer<typeof lifestyleSchema>;
type FamilyForm = z.infer<typeof familySchema>;
type HoroscopeForm = z.infer<typeof horoscopeSchema>;
type PreferencesForm = z.infer<typeof preferencesSchema>;

function SaveStatus({saved, saving}: { saved: boolean; saving: boolean }) {
    if (saving) return <span className="text-xs text-gray-400">Saving…</span>;
    if (saved) return (
        <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
        </span>
    );
    return null;
}

function FieldRow({label, hint, children}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
            {children}
        </div>
    );
}

// ── Inner page (needs useSearchParams → must be wrapped in Suspense) ─────────

function ProfileEditInner() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') ?? 'basic';

    const queryClient = useQueryClient();
    const [savedTab, setSavedTab] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {data: profileRes, isLoading} = useQuery({
        queryKey: ['my-profile'],
        queryFn: () => profileService.getMyProfile().then((r) => r.data),
    });

    const {data: completionRes} = useQuery({
        queryKey: ['profile-completion'],
        queryFn: () => profileService.getCompletionStatus().then((r) => r.data.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => profileService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['my-profile']});
            queryClient.invalidateQueries({queryKey: ['profile-completion']});
        },
    });

    const prefMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => profileService.updatePreferences(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['my-profile']});
            queryClient.invalidateQueries({queryKey: ['profile-completion']});
        },
    });

    const profile = profileRes?.data;

    const basicForm = useForm<BasicForm>({resolver: zodResolver(basicSchema)});
    const religiousForm = useForm<ReligiousForm>({resolver: zodResolver(religiousSchema)});
    const educationForm = useForm<EducationForm>({resolver: zodResolver(educationSchema)});
    const lifestyleForm = useForm<LifestyleForm>({resolver: zodResolver(lifestyleSchema)});
    const familyForm = useForm<FamilyForm>({resolver: zodResolver(familySchema)});
    const horoscopeForm = useForm<HoroscopeForm>({resolver: zodResolver(horoscopeSchema)});
    const preferencesForm = useForm<PreferencesForm>({resolver: zodResolver(preferencesSchema)});

    useEffect(() => {
        if (!profile) return;
        const p = profile.profile;
        if (p) {
            basicForm.reset({
                dob: p.dob ?? '',
                height_cm: p.height_cm?.toString() ?? '',
                weight_kg: p.weight_kg?.toString() ?? '',
                complexion: p.complexion ?? '',
                blood_group: p.blood_group ?? '',
                marital_status: p.marital_status ?? '',
                mother_tongue: p.mother_tongue ?? '',
                nationality: p.nationality ?? '',
                country: p.country ?? '',
                state: p.state ?? '',
                city: p.city ?? '',
                about_me: p.about_me ?? '',
            });
        }
        if (profile.religious_detail) {
            religiousForm.reset({
                religion: profile.religious_detail.religion ?? '',
                caste: profile.religious_detail.caste ?? '',
                sub_caste: profile.religious_detail.sub_caste ?? '',
                gotra: profile.religious_detail.gotra ?? '',
                manglik_status: (profile.religious_detail.manglik_status as ReligiousForm['manglik_status']) ?? undefined,
            });
        }
        if (profile.education_career) {
            educationForm.reset({
                highest_education: profile.education_career.highest_education ?? '',
                college_university: profile.education_career.college_university ?? '',
                profession: profile.education_career.profession ?? '',
                employed_in: (profile.education_career.employed_in as EducationForm['employed_in']) ?? undefined,
                annual_income_bdt: profile.education_career.annual_income_bdt?.toString() ?? '',
            });
        }
        if (profile.lifestyle) {
            lifestyleForm.reset({
                diet: (profile.lifestyle.diet as LifestyleForm['diet']) ?? undefined,
                smoking: (profile.lifestyle.smoking as LifestyleForm['smoking']) ?? undefined,
                drinking: (profile.lifestyle.drinking as LifestyleForm['drinking']) ?? undefined,
            });
        }
        if (profile.family_detail) {
            const fd = profile.family_detail;
            familyForm.reset({
                family_type: fd.family_type ?? '',
                family_status: fd.family_status ?? '',
                family_income_bdt_per_month: fd.family_income_bdt_per_month?.toString() ?? '',
                father_occupation: fd.father_occupation ?? '',
                mother_occupation: fd.mother_occupation ?? '',
                brothers_count: fd.brothers_count?.toString() ?? '0',
                sisters_count: fd.sisters_count?.toString() ?? '0',
            });
        }
        if (profile.horoscope_detail) {
            const h = profile.horoscope_detail;
            horoscopeForm.reset({
                birth_place: h.birth_place ?? '',
                birth_time: h.birth_time ?? '',
                rashi: h.rashi ?? '',
                nakshatra: h.nakshatra ?? '',
                manglik: h.manglik ?? false,
            });
        }
        if (profile.partner_preference) {
            const pp = profile.partner_preference;
            preferencesForm.reset({
                age_min: pp.age_min?.toString() ?? '',
                age_max: pp.age_max?.toString() ?? '',
                height_min_cm: pp.height_min_cm?.toString() ?? '',
                height_max_cm: pp.height_max_cm?.toString() ?? '',
                pref_marital_status: pp.marital_status ?? [],
                pref_diet: pp.diet ?? [],
                pref_education: pp.education ?? [],
                pref_religion: pp.religion?.join(', ') ?? '',
                pref_caste: pp.caste?.join(', ') ?? '',
                pref_profession: pp.profession?.join(', ') ?? '',
                income_min_bdt: pp.income_min_bdt?.toString() ?? '',
                income_max_bdt: pp.income_max_bdt?.toString() ?? '',
                pref_country: pp.country?.join(', ') ?? '',
                pref_city: pp.city?.join(', ') ?? '',
                smoking_acceptable: pp.smoking_acceptable ?? false,
                drinking_acceptable: pp.drinking_acceptable ?? false,
            });
        }
    }, [profile]);

    const coerceNumeric = (data: Record<string, unknown>, keys: string[]) => {
        const out = {...data};
        for (const k of keys) {
            if (k in out && out[k] !== '' && out[k] != null) out[k] = Number(out[k]);
            else if (k in out && out[k] === '') delete out[k];
        }
        return out;
    };

    const handleSave = async (data: Record<string, unknown>, tabKey: string) => {
        let processed = {...data};

        // Strip empty-string values for enum fields — backend `in:` rule rejects ""
        for (const k of Object.keys(processed)) {
            if (ENUM_FIELDS.has(k) && processed[k] === '') delete processed[k];
        }

        processed = coerceNumeric(processed, [
            'height_cm', 'weight_kg', 'annual_income_bdt',
            'family_income_bdt_per_month', 'brothers_count', 'sisters_count',
        ]);

        await saveMutation.mutateAsync(processed);
        setSavedTab(tabKey);
        setTimeout(() => setSavedTab(null), 2000);
    };

    const handleSavePreferences = async (data: PreferencesForm) => {
        // toArray: convert comma-separated free-text to array (for open fields)
        const toArray = (v: string | undefined): string[] | null =>
            v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;

        // toArr: normalize checkbox arrays (empty array → null for backend)
        const toArr = (v: string[] | undefined): string[] | null =>
            v && v.length > 0 ? v : null;

        const payload = {
            age_min: data.age_min ? Number(data.age_min) : null,
            age_max: data.age_max ? Number(data.age_max) : null,
            height_min_cm: data.height_min_cm ? Number(data.height_min_cm) : null,
            height_max_cm: data.height_max_cm ? Number(data.height_max_cm) : null,
            marital_status: toArr(data.pref_marital_status),   // strict enum — checkboxes
            diet: toArr(data.pref_diet),              // strict enum — checkboxes
            education: toArr(data.pref_education),         // known values — checkboxes
            religion: toArray(data.pref_religion),            // free text
            caste: toArray(data.pref_caste),               // free text
            profession: toArray(data.pref_profession),          // free text
            country: toArray(data.pref_country),             // free text
            city: toArray(data.pref_city),                // free text
            income_min_bdt: data.income_min_bdt ? Number(data.income_min_bdt) : null,
            income_max_bdt: data.income_max_bdt ? Number(data.income_max_bdt) : null,
            smoking_acceptable: data.smoking_acceptable ?? false,
            drinking_acceptable: data.drinking_acceptable ?? false,
        };

        await prefMutation.mutateAsync(payload);
        setSavedTab('preferences');
        setTimeout(() => setSavedTab(null), 2000);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        setPhotoError(null);
        try {
            await profileService.uploadPhoto(file);
            queryClient.invalidateQueries({queryKey: ['my-profile']});
            queryClient.invalidateQueries({queryKey: ['profile-completion']});
        } catch {
            setPhotoError('Upload failed. Please try a smaller image (max 5 MB).');
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        await profileService.deletePhoto(photoId);
        queryClient.invalidateQueries({queryKey: ['my-profile']});
        queryClient.invalidateQueries({queryKey: ['profile-completion']});
    };

    const handleSetPrimary = async (photoId: number) => {
        await profileService.setPrimaryPhoto(photoId);
        queryClient.invalidateQueries({queryKey: ['my-profile']});
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl h-96 animate-pulse"/>
            </div>
        );
    }

    const selectClass =
        'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]';
    const photos: ProfilePhoto[] = profile?.photos ?? [];

    return (
        <div className="max-w-3xl mx-auto pb-20 md:pb-6 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1F2937]">Edit Profile</h1>
                <p className="text-sm text-gray-500 mt-0.5">Keep your profile up to date for the best matches</p>
            </div>

            {completionRes && <ProfileCompletionBar status={completionRes}/>}

            <Tabs defaultValue={initialTab} className="w-full">
                {/* Scrollable tabs */}
                <div className="overflow-x-auto pb-1">
                    <TabsList className="flex min-w-max gap-1 h-auto p-1 rounded-xl bg-gray-100 mb-6">
                        {[
                            {value: 'basic', label: 'Basic'},
                            {value: 'religion', label: 'Religion'},
                            {value: 'career', label: 'Career'},
                            {value: 'lifestyle', label: 'Lifestyle'},
                            {value: 'family', label: 'Family'},
                            {value: 'horoscope', label: 'Horoscope'},
                            {value: 'photo', label: 'Photos'},
                            {value: 'preferences', label: 'Preferences'},
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#C9A227]"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── Basic Info ─────────────────────────────────────────────────── */}
                <TabsContent value="basic">
                    <form
                        onSubmit={basicForm.handleSubmit((d) => handleSave(d, 'basic'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#1F2937]">Basic Information</h2>
                            <SaveStatus saved={savedTab === 'basic'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Date of Birth">
                                <Input type="date"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('dob')} />
                            </FieldRow>
                            <FieldRow label="Marital Status">
                                <select {...basicForm.register('marital_status')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="never_married">Never Married</option>
                                    <option value="divorced">Divorced</option>
                                    <option value="widowed">Widowed</option>
                                    <option value="awaiting_divorce">Awaiting Divorce</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Height (cm)">
                                <Input type="number" placeholder="e.g. 165"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('height_cm')} />
                            </FieldRow>
                            <FieldRow label="Weight (kg)">
                                <Input type="number" placeholder="e.g. 60"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('weight_kg')} />
                            </FieldRow>
                            <FieldRow label="Complexion">
                                <select {...basicForm.register('complexion')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="very_fair">Very Fair</option>
                                    <option value="fair">Fair</option>
                                    <option value="wheatish">Wheatish</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Blood Group">
                                <select {...basicForm.register('blood_group')} className={selectClass}>
                                    <option value="">Select…</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </FieldRow>
                            <FieldRow label="Mother Tongue">
                                <Input placeholder="e.g. Bengali"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('mother_tongue')} />
                            </FieldRow>
                            <FieldRow label="Nationality">
                                <Input placeholder="e.g. Bangladeshi"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('nationality')} />
                            </FieldRow>
                            <FieldRow label="Country">
                                <Input placeholder="e.g. Bangladesh"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('country')} />
                            </FieldRow>
                            <FieldRow label="City">
                                <Input placeholder="e.g. Dhaka"
                                       className="focus-visible:ring-[#C9A227]" {...basicForm.register('city')} />
                            </FieldRow>
                        </div>
                        <FieldRow label="About Me (min. 50 characters for full score)">
                            <Textarea
                                rows={4}
                                placeholder="Tell potential matches about yourself…"
                                className="resize-none focus-visible:ring-[#C9A227]"
                                {...basicForm.register('about_me')}
                            />
                        </FieldRow>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Religious ──────────────────────────────────────────────────── */}
                <TabsContent value="religion">
                    <form
                        onSubmit={religiousForm.handleSubmit((d) => handleSave(d, 'religion'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#1F2937]">Religious Background</h2>
                            <SaveStatus saved={savedTab === 'religion'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Religion">
                                <Input placeholder="e.g. Islam, Hindu"
                                       className="focus-visible:ring-[#C9A227]" {...religiousForm.register('religion')} />
                            </FieldRow>
                            <FieldRow label="Caste">
                                <Input placeholder="e.g. Sunni"
                                       className="focus-visible:ring-[#C9A227]" {...religiousForm.register('caste')} />
                            </FieldRow>
                            <FieldRow label="Sub Caste">
                                <Input placeholder="Optional"
                                       className="focus-visible:ring-[#C9A227]" {...religiousForm.register('sub_caste')} />
                            </FieldRow>
                            <FieldRow label="Manglik Status">
                                <select {...religiousForm.register('manglik_status')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="partial">Partial</option>
                                    <option value="dont_know">Don&apos;t Know</option>
                                </select>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            Save Changes
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Career ─────────────────────────────────────────────────────── */}
                <TabsContent value="career">
                    <form
                        onSubmit={educationForm.handleSubmit((d) => handleSave(d, 'career'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#1F2937]">Education &amp; Career</h2>
                            <SaveStatus saved={savedTab === 'career'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Highest Education">
                                <select {...educationForm.register('highest_education')} className={selectClass}>
                                    <option value="">Select…</option>
                                    {['below_ssc', 'ssc', 'hsc', 'diploma', 'bachelors', 'masters', 'phd', 'postdoctoral'].map((e) => (
                                        <option key={e} value={e}>
                                            {e.replace(/_/g, ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </FieldRow>
                            <FieldRow label="College / University">
                                <Input placeholder="University name"
                                       className="focus-visible:ring-[#C9A227]" {...educationForm.register('college_university')} />
                            </FieldRow>
                            <FieldRow label="Profession">
                                <Input placeholder="e.g. Software Engineer"
                                       className="focus-visible:ring-[#C9A227]" {...educationForm.register('profession')} />
                            </FieldRow>
                            <FieldRow label="Employed In">
                                <select {...educationForm.register('employed_in')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="private">Private Sector</option>
                                    <option value="government">Government</option>
                                    <option value="business">Business</option>
                                    <option value="self_employed">Self-Employed</option>
                                    <option value="not_working">Not Working</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Annual Income (BDT)">
                                <Input type="number" placeholder="e.g. 600000"
                                       className="focus-visible:ring-[#C9A227]" {...educationForm.register('annual_income_bdt')} />
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            Save Changes
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Lifestyle ──────────────────────────────────────────────────── */}
                <TabsContent value="lifestyle">
                    <form
                        onSubmit={lifestyleForm.handleSubmit((d) => handleSave(d, 'lifestyle'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#1F2937]">Lifestyle</h2>
                            <SaveStatus saved={savedTab === 'lifestyle'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Diet">
                                <select {...lifestyleForm.register('diet')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="non_vegetarian">Non-Vegetarian</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="jain">Jain</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Smoking">
                                <select {...lifestyleForm.register('smoking')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="non_smoker">Non-Smoker</option>
                                    <option value="smoker">Smoker</option>
                                    <option value="occasionally">Occasionally</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Drinking">
                                <select {...lifestyleForm.register('drinking')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="non_drinker">Non-Drinker</option>
                                    <option value="drinker">Drinker</option>
                                    <option value="occasionally">Occasionally</option>
                                </select>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            Save Changes
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Family ─────────────────────────────────────────────────────── */}
                <TabsContent value="family">
                    <form
                        onSubmit={familyForm.handleSubmit((d) => handleSave(d, 'family'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#1F2937]">Family Details</h2>
                            <SaveStatus saved={savedTab === 'family'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Family Type">
                                <select {...familyForm.register('family_type')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="nuclear">Nuclear</option>
                                    <option value="joint">Joint</option>
                                    <option value="extended">Extended</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Family Status">
                                <select {...familyForm.register('family_status')} className={selectClass}>
                                    <option value="">Select…</option>
                                    <option value="middle_class">Middle Class</option>
                                    <option value="upper_middle_class">Upper Middle Class</option>
                                    <option value="rich">Rich</option>
                                    <option value="affluent">Affluent</option>
                                </select>
                            </FieldRow>
                            <FieldRow label="Monthly Family Income (BDT)">
                                <Input
                                    type="number"
                                    placeholder="e.g. 80000"
                                    className="focus-visible:ring-[#C9A227]"
                                    {...familyForm.register('family_income_bdt_per_month')}
                                />
                            </FieldRow>
                            <FieldRow label="Father's Occupation">
                                <Input placeholder="e.g. Businessman"
                                       className="focus-visible:ring-[#C9A227]" {...familyForm.register('father_occupation')} />
                            </FieldRow>
                            <FieldRow label="Mother's Occupation">
                                <Input placeholder="e.g. Homemaker"
                                       className="focus-visible:ring-[#C9A227]" {...familyForm.register('mother_occupation')} />
                            </FieldRow>
                            <FieldRow label="Number of Brothers">
                                <Input type="number" min="0" placeholder="0"
                                       className="focus-visible:ring-[#C9A227]" {...familyForm.register('brothers_count')} />
                            </FieldRow>
                            <FieldRow label="Number of Sisters">
                                <Input type="number" min="0" placeholder="0"
                                       className="focus-visible:ring-[#C9A227]" {...familyForm.register('sisters_count')} />
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Horoscope ──────────────────────────────────────────────────── */}
                <TabsContent value="horoscope">
                    <form
                        onSubmit={horoscopeForm.handleSubmit((d) => handleSave(d, 'horoscope'))}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="font-semibold text-[#1F2937]">Horoscope Details</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Filling at least one field here completes the Horoscope section (5%).
                                </p>
                            </div>
                            <SaveStatus saved={savedTab === 'horoscope'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Birth Place">
                                <Input placeholder="e.g. Dhaka"
                                       className="focus-visible:ring-[#C9A227]" {...horoscopeForm.register('birth_place')} />
                            </FieldRow>
                            <FieldRow label="Birth Time">
                                <Input type="time"
                                       className="focus-visible:ring-[#C9A227]" {...horoscopeForm.register('birth_time')} />
                            </FieldRow>
                            <FieldRow label="Rashi (Moon Sign)">
                                <Input placeholder="e.g. Aries, Taurus"
                                       className="focus-visible:ring-[#C9A227]" {...horoscopeForm.register('rashi')} />
                            </FieldRow>
                            <FieldRow label="Nakshatra">
                                <Input placeholder="e.g. Ashwini"
                                       className="focus-visible:ring-[#C9A227]" {...horoscopeForm.register('nakshatra')} />
                            </FieldRow>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox"
                                   className="w-4 h-4 accent-[#C9A227]" {...horoscopeForm.register('manglik')} />
                            <span className="text-sm text-gray-700">Manglik</span>
                        </label>
                        <Button type="submit" disabled={saveMutation.isPending}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Photos ─────────────────────────────────────────────────────── */}
                <TabsContent value="photo">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <div>
                            <h2 className="font-semibold text-[#1F2937]">Profile Photos</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Upload clear, recent photos. Hover a photo to set it as primary or delete it.
                            </p>
                        </div>

                        {/* Upload */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl"
                            >
                                {uploadingPhoto ? 'Uploading…' : '+ Upload Photo'}
                            </Button>
                            {photoError && <p className="text-xs text-red-500 mt-2">{photoError}</p>}
                        </div>

                        {/* Photo grid */}
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {photos.map((photo) => (
                                    <div key={photo.id}
                                         className="relative group rounded-xl overflow-hidden border border-gray-100">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${photo.file_path}`}
                                            alt="Profile photo"
                                            className="w-full aspect-square object-cover"
                                        />
                                        {photo.is_primary && (
                                            <span
                                                className="absolute top-2 left-2 bg-[#C9A227] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                                        )}
                                        {photo.moderation_status === 'pending' && (
                                            <span
                                                className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                                        )}
                                        {photo.moderation_status === 'rejected' && (
                                            <span
                                                className="absolute top-2 right-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Rejected
                      </span>
                                        )}
                                        <div
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end gap-1 pb-3">
                                            {!photo.is_primary && (
                                                <button
                                                    onClick={() => handleSetPrimary(photo.id)}
                                                    className="text-white text-xs bg-[#C9A227] rounded-full px-3 py-1 hover:bg-[#b8911f] transition-colors"
                                                >
                                                    Set Primary
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeletePhoto(photo.id)}
                                                className="text-white text-xs bg-red-500 rounded-full px-3 py-1 hover:bg-red-600 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                <p className="text-gray-500 font-medium text-sm">No photos yet</p>
                                <p className="text-xs text-gray-400 mt-1">Upload your first photo to attract more
                                    matches</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ── Partner Preferences ────────────────────────────────────────── */}
                <TabsContent value="preferences">
                    <form
                        onSubmit={preferencesForm.handleSubmit(handleSavePreferences)}
                        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-[#1F2937]">Partner Preferences</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    What you are looking for in a partner.
                                </p>
                            </div>
                            <SaveStatus saved={savedTab === 'preferences'} saving={prefMutation.isPending}/>
                        </div>

                        {/* Age & Height ranges */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Partner's Age Range">
                                <div className="flex gap-2 items-center">
                                    <Input type="number" placeholder="Min (e.g. 22)"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('age_min')} />
                                    <span className="text-gray-400 text-sm">–</span>
                                    <Input type="number" placeholder="Max (e.g. 30)"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('age_max')} />
                                </div>
                            </FieldRow>
                            <FieldRow label="Partner's Height Range (cm)">
                                <div className="flex gap-2 items-center">
                                    <Input type="number" placeholder="Min (e.g. 150)"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('height_min_cm')} />
                                    <span className="text-gray-400 text-sm">–</span>
                                    <Input type="number" placeholder="Max (e.g. 180)"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('height_max_cm')} />
                                </div>
                            </FieldRow>
                            <FieldRow label="Partner's Annual Income Range (BDT)">
                                <div className="flex gap-2 items-center">
                                    <Input type="number" placeholder="Min"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('income_min_bdt')} />
                                    <span className="text-gray-400 text-sm">–</span>
                                    <Input type="number" placeholder="Max"
                                           className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('income_max_bdt')} />
                                </div>
                            </FieldRow>
                        </div>

                        {/* Marital Status — checkboxes (strict enum on backend) */}
                        <FieldRow label="Acceptable Marital Status">
                            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                                {[
                                    {value: 'never_married', label: 'Never Married'},
                                    {value: 'divorced', label: 'Divorced'},
                                    {value: 'widowed', label: 'Widowed'},
                                    {value: 'awaiting_divorce', label: 'Awaiting Divorce'},
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={opt.value}
                                            className="w-4 h-4 accent-[#C9A227]"
                                            {...preferencesForm.register('pref_marital_status')}
                                        />
                                        <span className="text-sm text-gray-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </FieldRow>

                        {/* Diet — checkboxes (strict enum on backend) */}
                        <FieldRow label="Acceptable Diet">
                            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                                {[
                                    {value: 'non_vegetarian', label: 'Non-Vegetarian'},
                                    {value: 'vegetarian', label: 'Vegetarian'},
                                    {value: 'vegan', label: 'Vegan'},
                                    {value: 'jain', label: 'Jain'},
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={opt.value}
                                            className="w-4 h-4 accent-[#C9A227]"
                                            {...preferencesForm.register('pref_diet')}
                                        />
                                        <span className="text-sm text-gray-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </FieldRow>

                        {/* Education — checkboxes (known values) */}
                        <FieldRow label="Minimum Education Level">
                            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                                {[
                                    {value: 'below_ssc', label: 'Below SSC'},
                                    {value: 'ssc', label: 'SSC'},
                                    {value: 'hsc', label: 'HSC'},
                                    {value: 'diploma', label: 'Diploma'},
                                    {value: 'bachelors', label: 'Bachelors'},
                                    {value: 'masters', label: 'Masters'},
                                    {value: 'phd', label: 'PhD'},
                                    {value: 'postdoctoral', label: 'Postdoctoral'},
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={opt.value}
                                            className="w-4 h-4 accent-[#C9A227]"
                                            {...preferencesForm.register('pref_education')}
                                        />
                                        <span className="text-sm text-gray-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </FieldRow>

                        {/* Free-text fields (no strict enum on backend) */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Partner's Religion" hint="Comma-separated, e.g. Islam, Hindu">
                                <Input placeholder="Islam, Hindu"
                                       className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('pref_religion')} />
                            </FieldRow>
                            <FieldRow label="Partner's Caste" hint="Comma-separated, e.g. Sunni, Brahmin">
                                <Input placeholder="Sunni, Brahmin"
                                       className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('pref_caste')} />
                            </FieldRow>
                            <FieldRow label="Partner's Profession" hint="Comma-separated, e.g. Doctor, Engineer">
                                <Input placeholder="Doctor, Engineer"
                                       className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('pref_profession')} />
                            </FieldRow>
                            <FieldRow label="Partner's Country" hint="e.g. Bangladesh, India">
                                <Input placeholder="Bangladesh, India"
                                       className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('pref_country')} />
                            </FieldRow>
                            <FieldRow label="Partner's City" hint="e.g. Dhaka, Chittagong">
                                <Input placeholder="Dhaka, Chittagong"
                                       className="focus-visible:ring-[#C9A227]" {...preferencesForm.register('pref_city')} />
                            </FieldRow>
                        </div>

                        {/* Lifestyle acceptability */}
                        <div className="flex gap-6 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox"
                                       className="w-4 h-4 accent-[#C9A227]" {...preferencesForm.register('smoking_acceptable')} />
                                <span className="text-sm text-gray-700">Smoking acceptable</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox"
                                       className="w-4 h-4 accent-[#C9A227]" {...preferencesForm.register('drinking_acceptable')} />
                                <span className="text-sm text-gray-700">Drinking acceptable</span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={prefMutation.isPending}
                            className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl"
                        >
                            {prefMutation.isPending ? 'Saving…' : 'Save Preferences'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ── Page export (Suspense for useSearchParams) ────────────────────────────────

export default function ProfileEditPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl h-96 animate-pulse"/>
                </div>
            }
        >
            <ProfileEditInner/>
        </Suspense>
    );
}

