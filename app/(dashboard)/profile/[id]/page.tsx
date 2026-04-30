'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { profileService, interestService, shortlistService, blockService, reportService } from '@/services/profileService';
import { chatService } from '@/services/chatService';
import { CompatibilityScore } from '@/components/match/CompatibilityScore';
import { formatAge, formatHeight, timeAgo } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import type { FullProfile } from '@/types/profile';

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'inappropriate_photo', label: 'Inappropriate Photo' },
  { value: 'abusive', label: 'Abusive Behavior' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

export default function ProfileViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [interestSent, setInterestSent] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('fake_profile');
  const [reportDesc, setReportDesc] = useState('');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const { data: profileRes, isLoading, isError } = useQuery({
    queryKey: ['profile', params.id],
    queryFn: () => profileService.getProfileById(params.id).then((r) => r.data),
    enabled: !!params.id,
  });

  const { data: scoreRes } = useQuery({
    queryKey: ['compatibility-score', profileRes?.data?.id],
    queryFn: () =>
      profileRes?.data?.id
        ? profileService.getProfileById(params.id).then(() =>
            import('@/services/profileService').then(({ matchService }) =>
              matchService.getCompatibilityScore(profileRes.data.id).then((r) => r.data.data)
            )
          )
        : null,
    enabled: !!profileRes?.data?.id,
  });

  const sendInterestMutation = useMutation({
    mutationFn: (id: number) => interestService.send(id),
    onSuccess: () => setInterestSent(true),
  });

  const shortlistMutation = useMutation({
    mutationFn: (id: number) => shortlistService.toggle(id),
    onSuccess: () => setShortlisted((s) => !s),
  });

  const blockMutation = useMutation({
    mutationFn: (id: number) => blockService.block(id),
    onSuccess: () => router.push('/matches'),
  });

  const [messageError, setMessageError] = useState<string | null>(null);

  const messageMutation = useMutation({
    mutationFn: (userId: number) => chatService.getOrCreateConversation(userId),
    onSuccess: (conv) => router.push(`/chat/${conv.id}`),
    onError: () => setMessageError('Chat is only available after a mutual interest is accepted.'),
  });

  const reportMutation = useMutation({
    mutationFn: (data: { reported_id: number; reason: string; description?: string }) =>
      reportService.report(data),
    onSuccess: () => {
      setReportOpen(false);
      setReportDesc('');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl h-96 animate-pulse" />
      </div>
    );
  }

  if (isError || !profileRes?.data) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-red-100 p-16 text-center">
        <p className="text-5xl mb-4">❌</p>
        <p className="text-lg font-semibold text-gray-700">Profile not found</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">Go back</Button>
      </div>
    );
  }

  const p: FullProfile = profileRes.data;
  const photos = p.photos?.filter((ph) => ph.is_approved) ?? [];
  const activePhoto = photos[activePhotoIdx];

  const isOwnProfile = currentUser?.id === p.id;

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-6 space-y-4">
      {/* Top card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="md:flex">
          {/* Photo gallery */}
          <div className="md:w-72 flex-shrink-0">
            <div className="relative aspect-square bg-gray-100">
              {activePhoto ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${activePhoto.file_path}`}
                  alt={`${p.name}'s photo`}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-gray-300">
                  {p.gender === 'female' ? '👩' : '👨'}
                </div>
              )}
              {p.profile?.is_verified && (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs text-green-600 font-medium">
                  ✓ Verified
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-1.5 p-2 overflow-x-auto">
                {photos.map((ph, i) => (
                  <button key={ph.id} onClick={() => setActivePhotoIdx(i)}
                    className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === activePhotoIdx ? 'border-[#C9A227]' : 'border-transparent'}`}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${ph.file_path}`}
                      alt="thumbnail" width={56} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937]">{p.name}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {p.profile?.profile_id && <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">{p.profile.profile_id}</span>}
                  {formatAge(p.profile?.dob)}
                  {p.profile?.city ? ` • ${p.profile.city}` : ''}
                  {p.profile?.country ? `, ${p.profile.country}` : ''}
                </p>
              </div>

              {scoreRes && <CompatibilityScore score={scoreRes.score} size="lg" />}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {p.profile?.height_cm && <div className="text-gray-600">📏 {formatHeight(p.profile.height_cm)}</div>}
              {p.profile?.marital_status && <div className="text-gray-600">💍 {p.profile.marital_status.replace('_', ' ')}</div>}
              {p.religious_detail?.religion && <div className="text-gray-600">🕌 {p.religious_detail.religion}</div>}
              {p.education_career?.highest_education && <div className="text-gray-600">🎓 {p.education_career.highest_education}</div>}
              {p.education_career?.profession && <div className="text-gray-600">💼 {p.education_career.profession}</div>}
              {p.lifestyle?.diet && <div className="text-gray-600">🍽 {p.lifestyle.diet.replace('_', '-')}</div>}
              {p.family_detail?.family_type && <div className="text-gray-600">👨‍👩‍👧 {p.family_detail.family_type} family</div>}
              {p.profile?.last_seen_at && <div className="text-gray-400 text-xs">Last seen: {timeAgo(p.profile.last_seen_at)}</div>}
            </div>

            {p.profile?.about_me && (
              <div className="mt-4 p-4 bg-[#FBF6E8] rounded-xl">
                <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{p.profile.about_me}&rdquo;</p>
              </div>
            )}

            {/* Actions */}
            {!isOwnProfile && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  onClick={() => sendInterestMutation.mutate(p.id)}
                  disabled={interestSent || sendInterestMutation.isPending}
                  className={`rounded-xl ${interestSent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-[#C9A227] hover:bg-[#b8911f] text-white'}`}
                >
                  {interestSent ? '✓ Interest Sent' : '💌 Send Interest'}
                </Button>

                {/* Send Message — available for all; backend enforces mutual-interest requirement */}
                <Button
                  onClick={() => { setMessageError(null); messageMutation.mutate(p.id); }}
                  disabled={messageMutation.isPending}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  {messageMutation.isPending ? '⌛ Opening…' : '💬 Send Message'}
                </Button>

                {messageError && (
                  <p className="w-full text-xs text-red-500 mt-1">{messageError}</p>
                )}

                <Button
                  onClick={() => shortlistMutation.mutate(p.id)}
                  disabled={shortlistMutation.isPending}
                  variant="outline"
                  className={`rounded-xl ${shortlisted ? 'border-[#C9A227] text-[#C9A227]' : 'border-gray-200'}`}
                >
                  {shortlisted ? '⭐ Shortlisted' : '☆ Shortlist'}
                </Button>

                <Button
                  onClick={() => setReportOpen(true)}
                  variant="outline"
                  className="rounded-xl border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
                >
                  🚩 Report
                </Button>

                <Button
                  onClick={() => { if (confirm('Block this user? They will not be able to see your profile.')) blockMutation.mutate(p.id); }}
                  variant="outline"
                  className="rounded-xl border-gray-200 text-gray-400 hover:text-red-600"
                >
                  🚫 Block
                </Button>
              </div>
            )}

            {isOwnProfile && (
              <div className="mt-5">
                <Button asChild className="bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl">
                  <a href="/profile/edit">✏️ Edit Profile</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {p.religious_detail && (
          <DetailCard title="🕌 Religious Background">
            <Row label="Religion" value={p.religious_detail.religion} />
            <Row label="Caste" value={p.religious_detail.caste} />
            <Row label="Manglik Status" value={p.religious_detail.manglik_status} />
          </DetailCard>
        )}
        {p.family_detail && (
          <DetailCard title="👨‍👩‍👧 Family Details">
            <Row label="Family Type" value={p.family_detail.family_type} />
            <Row label="Family Status" value={p.family_detail.family_status?.replace('_', ' ')} />
            <Row label="Brothers" value={p.family_detail.brothers_count?.toString()} />
            <Row label="Sisters" value={p.family_detail.sisters_count?.toString()} />
          </DetailCard>
        )}
        {p.education_career && (
          <DetailCard title="🎓 Education & Career">
            <Row label="Education" value={p.education_career.highest_education} />
            <Row label="University" value={p.education_career.college_university} />
            <Row label="Profession" value={p.education_career.profession} />
            <Row label="Employed In" value={p.education_career.employed_in} />
          </DetailCard>
        )}
        {p.lifestyle && (
          <DetailCard title="🌿 Lifestyle">
            <Row label="Diet" value={p.lifestyle.diet} />
            <Row label="Smoking" value={p.lifestyle.smoking} />
            <Row label="Drinking" value={p.lifestyle.drinking} />
            {p.lifestyle.hobbies && p.lifestyle.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.lifestyle.hobbies.map((h) => (
                  <span key={h} className="text-xs bg-gray-100 rounded-full px-2.5 py-1">{h}</span>
                ))}
              </div>
            )}
          </DetailCard>
        )}
      </div>

      {/* Report modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
              >
                {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Description (optional)</label>
              <Textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Please provide any additional details…"
                maxLength={500}
                rows={3}
                className="resize-none focus-visible:ring-[#C9A227]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReportOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={() => reportMutation.mutate({ reported_id: p.id, reason: reportReason, description: reportDesc || undefined })}
                disabled={reportMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                {reportMutation.isPending ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-[#1F2937] mb-3 text-sm">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#1F2937] font-medium capitalize text-right max-w-[60%]">{value}</span>
    </div>
  );
}

