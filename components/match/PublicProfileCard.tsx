'use client';

import { formatAge, formatHeight, resolvePhotoUrl } from '@/lib/utils';
import type { PublicProfileCard } from '@/types/publicProfile';
import { MapPinIcon, UserIcon } from '@/components/ui/icons';

interface PublicProfileCardProps {
    profile: PublicProfileCard;
}

export function PublicProfileCard({ profile }: PublicProfileCardProps) {
    const location = [profile.profile?.city, profile.profile?.country]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="card-premium overflow-hidden animate-fade-in flex flex-col h-full">
            <div className="relative aspect-[4/5] bg-[var(--gold-50)]">
                {resolvePhotoUrl(profile.primary_photo) ? (
                    <img
                        src={resolvePhotoUrl(profile.primary_photo)!}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <UserIcon size={48} className="text-[var(--gold-200)]" strokeWidth={1.2} />
                    </div>
                )}
            </div>

            <div className="p-4">
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
        </div>
    );
}
