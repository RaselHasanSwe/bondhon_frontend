import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve a photo path returned by the Laravel backend into a full URL
 * that Next.js <Image> can load.
 *
 * The backend's Storage::url() returns a relative path like /storage/...
 * when no ASSET_URL is configured.  We must prepend the API base-URL so
 * Next.js loads from the backend server, not the frontend server.
 */
export function resolvePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already an absolute URL (https://... or http://...)
  if (/^https?:\/\//i.test(path)) return path;
  // Remove accidental leading slash before joining with base URL
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  const rel  = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
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

