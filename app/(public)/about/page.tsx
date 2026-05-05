import type { Metadata } from 'next';
import { getPage } from '@/services/publicService';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return {
    title: page.meta_title ?? 'About Us',
    description: page.meta_description ?? 'Learn about Bondhon matrimony platform.',
    openGraph: {
      title: page.meta_title ?? 'About Us — Bondhon',
      description: page.meta_description ?? '',
      type: 'website',
    },
  };
}

export default async function AboutPage() {
  const page = await getPage('about');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.meta_title ?? page.title,
    description: page.meta_description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Header */}
      <div
        className="py-14"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading, serif)' }}
          >
            About Us
          </h1>
          <p className="text-gray-400 mt-3">Get to know who we are and what we stand for</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article
          className="prose prose-lg max-w-none bg-white rounded-2xl border border-gray-100 p-8 md:p-12"
          style={{ '--tw-prose-headings': '#1F2937', '--tw-prose-links': '#C9A227' } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
        />
      </div>
    </>
  );
}

