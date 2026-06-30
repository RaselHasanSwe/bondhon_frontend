'use client';

import { formatAge, formatHeight, resolvePhotoUrl } from '@/lib/utils';
import type { PublicProfileCard } from '@/types/publicProfile';
import { MapPinIcon, UserIcon } from '@/components/ui/icons';

interface PublicProfileCardProps {
    profile: PublicProfileCard;
    onClick?: () => void;
}

export function PublicProfileCard({ profile, onClick }: PublicProfileCardProps) {
    const location = [profile.profile?.city, profile.profile?.country]
        .filter(Boolean)
        .join(', ');
    const photoUrl = resolvePhotoUrl(profile.primary_photo);

    return (
        <button
            type="button"
            onClick={onClick}
            className="card-premium overflow-hidden animate-fade-in flex flex-col h-full w-full text-left cursor-pointer transition-all duration-200 hover:border-[#C9A227]/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
            <div className="relative w-full aspect-[3/4] shrink-0 overflow-hidden bg-[var(--gold-50)]">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={profile.name}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <UserIcon size={48} className="text-[var(--gold-200)]" strokeWidth={1.2} />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4 min-h-[5.5rem]">
                <h3
                    className="font-semibold text-foreground truncate"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {profile.name}
                </h3>

                <div className="mt-1 space-y-0.5">
                    <p className="text-sm text-muted-foreground">
                        {formatAge(profile.profile?.dob)} • {formatHeight(profile.profile?.height_cm)}
                    </p>
                    {location && (
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1 truncate">
                            <MapPinIcon size={12} strokeWidth={1.8} />
                            {location}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}
