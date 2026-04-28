'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileService } from '@/services/profileService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileCompletionBar } from '@/components/profile/ProfileCompletionBar';

const basicSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  height_cm: z.string().optional(),
  weight_kg: z.string().optional(),
  marital_status: z.enum(['never_married', 'divorced', 'widowed', 'awaiting_divorce']).optional(),
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
  manglik_status: z.enum(['yes', 'no', 'partial', 'dont_know']).optional(),
});

const educationSchema = z.object({
  highest_education: z.string().max(100).optional(),
  college_university: z.string().max(200).optional(),
  profession: z.string().max(100).optional(),
  employed_in: z.enum(['private', 'government', 'business', 'self_employed', 'not_working']).optional(),
  annual_income_bdt: z.string().optional(),
});

const lifestyleSchema = z.object({
  diet: z.enum(['vegetarian', 'non_vegetarian', 'vegan', 'jain']).optional(),
  smoking: z.enum(['non_smoker', 'smoker', 'occasionally']).optional(),
  drinking: z.enum(['non_drinker', 'drinker', 'occasionally']).optional(),
});

type BasicForm = z.infer<typeof basicSchema>;
type ReligiousForm = z.infer<typeof religiousSchema>;
type EducationForm = z.infer<typeof educationSchema>;
type LifestyleForm = z.infer<typeof lifestyleSchema>;

function SaveStatus({ saved, saving }: { saved: boolean; saving: boolean }) {
  if (saving) return <span className="text-xs text-gray-400">Saving…</span>;
  if (saved) return <span className="text-xs text-green-600">✓ Saved</span>;
  return null;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export default function ProfileEditPage() {
  const queryClient = useQueryClient();
  const [savedTab, setSavedTab] = useState<string | null>(null);

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileService.getMyProfile().then((r) => r.data),
  });

  const { data: completionRes } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: () => profileService.getCompletionStatus().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileService.updateProfile(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
    },
  });

  const profile = profileRes?.data;

  // Basic info form
  const basicForm = useForm<BasicForm>({ resolver: zodResolver(basicSchema) });
  const religiousForm = useForm<ReligiousForm>({ resolver: zodResolver(religiousSchema) });
  const educationForm = useForm<EducationForm>({ resolver: zodResolver(educationSchema) });
  const lifestyleForm = useForm<LifestyleForm>({ resolver: zodResolver(lifestyleSchema) });

  // Populate forms when profile loads
  useEffect(() => {
    if (profile) {
      const p = profile.profile;
      if (p) {
        basicForm.reset({
          dob: p.dob ?? '',
          height_cm: p.height_cm?.toString() ?? '',
          weight_kg: p.weight_kg?.toString() ?? '',
          marital_status: (p.marital_status as BasicForm['marital_status']) ?? undefined,
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
    }
  }, [profile]);

  const handleSave = async (data: Record<string, unknown>, tabKey: string) => {
    // Coerce numeric string fields
    const processed = { ...data };
    if ('height_cm' in processed && processed.height_cm !== '' && processed.height_cm != null) {
      processed.height_cm = Number(processed.height_cm);
    }
    if ('weight_kg' in processed && processed.weight_kg !== '' && processed.weight_kg != null) {
      processed.weight_kg = Number(processed.weight_kg);
    }
    if ('annual_income_bdt' in processed && processed.annual_income_bdt !== '' && processed.annual_income_bdt != null) {
      processed.annual_income_bdt = Number(processed.annual_income_bdt);
    }
    await saveMutation.mutateAsync(processed);
    setSavedTab(tabKey);
    setTimeout(() => setSavedTab(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl h-96 animate-pulse" />
      </div>
    );
  }

  const selectClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]';

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Edit Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Keep your profile up to date for the best matches</p>
      </div>

      {completionRes && <ProfileCompletionBar status={completionRes} />}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 rounded-xl bg-gray-100 mb-6">
          {['basic', 'religion', 'career', 'lifestyle'].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="rounded-lg py-2 text-xs font-medium capitalize data-[state=active]:bg-white data-[state=active]:text-[#C9A227]">
              {tab === 'basic' ? '👤 Basic' : tab === 'religion' ? '🕌 Religion' : tab === 'career' ? '🎓 Career' : '🌿 Lifestyle'}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <form onSubmit={basicForm.handleSubmit((d) => handleSave(d, 'basic'))} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[#1F2937]">Basic Information</h2>
              <SaveStatus saved={savedTab === 'basic'} saving={saveMutation.isPending} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Date of Birth">
                <Input type="date" className="focus-visible:ring-[#C9A227]" {...basicForm.register('dob')} />
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
                <Input type="number" placeholder="e.g. 165" className="focus-visible:ring-[#C9A227]" {...basicForm.register('height_cm')} />
              </FieldRow>
              <FieldRow label="Weight (kg)">
                <Input type="number" placeholder="e.g. 60" className="focus-visible:ring-[#C9A227]" {...basicForm.register('weight_kg')} />
              </FieldRow>
              <FieldRow label="Mother Tongue">
                <Input placeholder="e.g. Bengali" className="focus-visible:ring-[#C9A227]" {...basicForm.register('mother_tongue')} />
              </FieldRow>
              <FieldRow label="Nationality">
                <Input placeholder="e.g. Bangladeshi" className="focus-visible:ring-[#C9A227]" {...basicForm.register('nationality')} />
              </FieldRow>
              <FieldRow label="Country">
                <Input placeholder="e.g. Bangladesh" className="focus-visible:ring-[#C9A227]" {...basicForm.register('country')} />
              </FieldRow>
              <FieldRow label="City">
                <Input placeholder="e.g. Dhaka" className="focus-visible:ring-[#C9A227]" {...basicForm.register('city')} />
              </FieldRow>
            </div>
            <FieldRow label="About Me (min. 50 characters for full score)">
              <Textarea rows={4} placeholder="Tell potential matches about yourself…" className="resize-none focus-visible:ring-[#C9A227]" {...basicForm.register('about_me')} />
            </FieldRow>
            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </TabsContent>

        {/* Religious */}
        <TabsContent value="religion">
          <form onSubmit={religiousForm.handleSubmit((d) => handleSave(d, 'religion'))} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[#1F2937]">Religious Background</h2>
              <SaveStatus saved={savedTab === 'religion'} saving={saveMutation.isPending} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Religion">
                <Input placeholder="e.g. Islam, Hindu" className="focus-visible:ring-[#C9A227]" {...religiousForm.register('religion')} />
              </FieldRow>
              <FieldRow label="Caste">
                <Input placeholder="e.g. Sunni" className="focus-visible:ring-[#C9A227]" {...religiousForm.register('caste')} />
              </FieldRow>
              <FieldRow label="Sub Caste">
                <Input placeholder="Optional" className="focus-visible:ring-[#C9A227]" {...religiousForm.register('sub_caste')} />
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
            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">Save Changes</Button>
          </form>
        </TabsContent>

        {/* Career */}
        <TabsContent value="career">
          <form onSubmit={educationForm.handleSubmit((d) => handleSave(d, 'career'))} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[#1F2937]">Education & Career</h2>
              <SaveStatus saved={savedTab === 'career'} saving={saveMutation.isPending} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Highest Education">
                <select {...educationForm.register('highest_education')} className={selectClass}>
                  <option value="">Select…</option>
                  {['below_ssc', 'ssc', 'hsc', 'diploma', 'bachelors', 'masters', 'phd', 'postdoctoral'].map((e) => (
                    <option key={e} value={e}>{e.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="College / University">
                <Input placeholder="University name" className="focus-visible:ring-[#C9A227]" {...educationForm.register('college_university')} />
              </FieldRow>
              <FieldRow label="Profession">
                <Input placeholder="e.g. Software Engineer" className="focus-visible:ring-[#C9A227]" {...educationForm.register('profession')} />
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
                <Input type="number" placeholder="e.g. 600000" className="focus-visible:ring-[#C9A227]" {...educationForm.register('annual_income_bdt')} />
              </FieldRow>
            </div>
            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">Save Changes</Button>
          </form>
        </TabsContent>

        {/* Lifestyle */}
        <TabsContent value="lifestyle">
          <form onSubmit={lifestyleForm.handleSubmit((d) => handleSave(d, 'lifestyle'))} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-[#1F2937]">Lifestyle</h2>
              <SaveStatus saved={savedTab === 'lifestyle'} saving={saveMutation.isPending} />
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
            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">Save Changes</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

