/**
 * publicService.ts
 *
 * Server-side fetch functions for public API endpoints (settings, pages).
 * Uses native fetch with ISR revalidation — NOT axios — so they work
 * safely in Next.js Server Components (no browser-only code).
 */

import type { SiteSettings } from '@/types/settings';
import type { PageDetail, PageListItem } from '@/types/page';
import { notFound } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'My Bouma';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<SiteSettings> {
  const res = await fetch(`${BASE_URL}/api/v1/settings`, {
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });

  if (!res.ok) {
    // Return sensible defaults if the backend is unavailable
    return {
      site_name: APP_NAME,
      site_logo: null,
      site_favicon: null,
      currency: 'BDT',
      currency_symbol: '৳',
      contact_email: null,
      contact_phone: null,
      contact_address: 'Dhaka, Bangladesh',
      face_scan_enabled: '1',
      facebook_url: null,
      twitter_url: null,
      instagram_url: null,
      meta_title: `${APP_NAME} — Premium Matrimony`,
      meta_description: `Find your perfect life partner on ${APP_NAME} — Bangladesh's most trusted matrimony platform.`,
      meta_keywords: 'matrimony, marriage, Bangladesh',
    };
  }

  const json: ApiResponse<SiteSettings> = await res.json();
  return json.data;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function getPages(): Promise<PageListItem[]> {
  const res = await fetch(`${BASE_URL}/api/v1/pages`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];

  const json: ApiResponse<PageListItem[]> = await res.json();
  return json.data ?? [];
}

export async function getPage(slug: string): Promise<PageDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/pages/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok || res.status === 404) {
    notFound();
  }

  const json: ApiResponse<PageDetail> = await res.json();

  if (!json.success || !json.data) {
    notFound();
  }

  return json.data;
}

