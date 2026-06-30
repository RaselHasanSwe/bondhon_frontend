import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

function getCfConfig() {
    return {
        delivery: (process.env.NEXT_PUBLIC_CF_IMAGE_DELIVERY_URL ?? '').replace(/\/$/, ''),
        hash: process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH ?? '',
    };
}

/** Build a Cloudflare Images delivery URL using the public variant. */
export function cfImageUrl(imageRef: string | null | undefined): string | null {
    if (!imageRef) return null;

    const base = resolveCfImageBase(imageRef);
    if (!base) return null;

    return `${base}/public`;
}

function resolveCfImageBase(ref: string): string | null {
    if (/^https?:\/\//i.test(ref)) {
        return ref.replace(/\/(public|w=[^/]+(?:,[^/]+)*)$/, '');
    }

    const { delivery, hash } = getCfConfig();
    if (!delivery || !hash) return null;

    const imageId = ref.replace(/^\//, '');
    return `${delivery}/${hash}/${imageId}`;
}

/** Resolve a Cloudflare image ID from the API into a delivery URL. */
export function resolvePhotoUrl(path: string | null | undefined): string | null {
    return cfImageUrl(path);
}

/** Resolve a profile photo using `file_path` or `url` from the API. */
export function resolveProfilePhotoUrl(
    photo: { url?: string | null; file_path?: string | null } | null | undefined,
): string | null {
    if (!photo) return null;
    return cfImageUrl(photo.file_path ?? photo.url);
}

export function formatAge(dob: string | null | undefined): string {
    if (!dob) return 'N/A';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age} yrs`;
}

export function formatHeight(cm: number | null | undefined): string {
    if (!cm) return 'N/A';
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}" (${cm} cm)`;
}

export function formatScore(score: number): string {
    return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-600';
}

export function timeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}
