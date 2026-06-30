'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { UserIcon } from '@/components/ui/icons';
import AnimateSection from '@/components/public/AnimateSection';
import { PublicProfileViewPromptModal } from '@/components/public/PublicProfileViewPromptModal';
import { publicSearchService } from '@/services/publicSearchService';
import { usePublicProfileCardAction } from '@/hooks/usePublicProfileCardAction';
import { useAuthStore } from '@/store/authStore';
import { resolvePhotoUrl } from '@/lib/utils';
import type { PublicProfileCard } from '@/types/publicProfile';

interface NewMembersPreviewProps {
    members: PublicProfileCard[];
}

function formatProfession(value: string | null | undefined): string | null {
    if (!value) return null;
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveMemberAge(member: PublicProfileCard): string | null {
    if (member.profile?.age != null) {
        return String(member.profile.age);
    }

    const dob = member.profile?.dob;
    if (!dob) return null;

    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return String(age);
}

function MemberCard({ member, onClick }: { member: PublicProfileCard; onClick: () => void }) {
    const photoUrl = resolvePhotoUrl(member.primary_photo);
    const age = resolveMemberAge(member);
    const city = member.profile?.city;
    const profession = formatProfession(member.profession);
    const metaParts: string[] = [];
    if (age) metaParts.push(`Age: ${age}`);
    if (city) metaParts.push(city);
    const metaLine = metaParts.join(' · ');

    return (
        <button
            type="button"
            onClick={onClick}
            className="group bg-white rounded-2xl p-4 border border-gray-100 text-center hover:border-[#C9A227] hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200 animate-fade-in-up w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50"
            style={{boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}
        >
            <div className="relative mx-auto mb-3 inline-block">
                <div
                    className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                    style={{background: 'linear-gradient(135deg,#FDF3CC,#FAE495)'}}
                >
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={member.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <UserIcon size={28} className="text-[#C9A227]" strokeWidth={1.5}/>
                    )}
                </div>
                {member.is_verified && (
                    <div
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
                        style={{background: 'linear-gradient(135deg,#C9A227,#D4AF37)'}}
                    >
                        <BadgeCheck size={11} className="text-white"/>
                    </div>
                )}
            </div>
            <p className="font-semibold text-gray-800 text-sm truncate">{member.name}</p>
            {metaLine && <p className="text-gray-400 text-xs truncate">{metaLine}</p>}
            {profession && (
                <p className="text-xs mt-0.5 font-medium truncate" style={{color: '#C9A227'}}>
                    {profession}
                </p>
            )}
        </button>
    );
}

export default function NewMembersPreview({members: initialMembers}: NewMembersPreviewProps) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);
    const [members, setMembers] = useState(initialMembers);

    useEffect(() => {
        if (!isAuthenticated) {
            setMembers(initialMembers);
            return;
        }

        let cancelled = false;

        publicSearchService
            .recent(6)
            .then((res) => {
                if (!cancelled) {
                    setMembers(res.data.data ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setMembers(
                        userId
                            ? initialMembers.filter((member) => member.id !== userId)
                            : initialMembers,
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [initialMembers, isAuthenticated, userId]);

    const visibleMembers = userId
        ? members.filter((member) => member.id !== userId)
        : members;

    const {
        selectedProfile,
        isModalOpen,
        handleProfileClick,
        setModalOpen,
    } = usePublicProfileCardAction();

    if (visibleMembers.length === 0) {
        return null;
    }

    return (
        <>
            <PublicProfileViewPromptModal
                profile={selectedProfile}
                open={isModalOpen}
                onOpenChange={setModalOpen}
            />
            <AnimateSection>
            <section className="py-16 md:py-20" style={{background: '#F8F9FB'}}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1"
                               style={{color: '#C9A227'}}>New Registrations</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Newly Joined Members</h2>
                        </div>
                        <Link href="/search?sort=latest"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
                              style={{color: '#C9A227'}}>
                            View All Profiles <ArrowRight size={14}/>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
                        {visibleMembers.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onClick={() => handleProfileClick(member)}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </AnimateSection>
        </>
    );
}
