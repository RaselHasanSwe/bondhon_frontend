import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings, getPage } from '@/services/publicService';
import type { PageDetail } from '@/types/page';
import { Heart, Search, Star, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings.meta_title ?? 'Bondhon — Premium Matrimony Platform',
    description: settings.meta_description ?? "Find your perfect life partner on Bondhon.",
    keywords: settings.meta_keywords ?? 'matrimony, marriage, Bangladesh',
    openGraph: {
      title: settings.meta_title ?? 'Bondhon — Premium Matrimony',
      description: settings.meta_description ?? '',
      type: 'website',
    },
  };
}

const features = [
  {
    icon: Shield,
    title: 'Verified Profiles',
    desc: 'Every profile goes through a strict verification process to ensure authenticity and safety.',
  },
  {
    icon: Search,
    title: 'Smart Matching',
    desc: 'Our algorithm analyses compatibility based on religion, education, location, lifestyle, and more.',
  },
  {
    icon: Heart,
    title: 'Privacy First',
    desc: 'Your contact details are never shared without your consent. You control your privacy settings.',
  },
  {
    icon: Users,
    title: 'Trusted Community',
    desc: 'Join thousands of families who have successfully found their perfect match through Bondhon.',
  },
];

const steps = [
  { step: '01', title: 'Create Your Profile', desc: 'Sign up for free and build your detailed matrimony profile with photos, preferences, and personal information.' },
  { step: '02', title: 'Discover Matches', desc: 'Browse compatible profiles suggested by our smart matching algorithm, or search with your own filters.' },
  { step: '03', title: 'Connect & Chat', desc: 'Send interest, accept connections, and chat with your matches. For premium members, voice and video calls are available.' },
];

export default async function HomePage() {
  const settings = await getSettings();

  // Fetch home hero page for fully dynamic hero section
  let heroPage: PageDetail | null = null;
  try {
    heroPage = await getPage('home_hero');
  } catch {
    // Fallback to static content
  }

  const heroTitle   = heroPage?.title       ?? 'Find Your Perfect Life Partner';
  const heroBadge   = heroPage?.meta_title  ?? "Bangladesh's Most Trusted Matrimony Platform";
  const heroSubtitle= heroPage?.meta_description ?? settings.meta_description
    ?? 'Join thousands of verified profiles and let our smart matching algorithm find your ideal match on ' + settings.site_name + '.';
  const heroContent = heroPage?.content ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.site_name,
    description: settings.meta_description,
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://bondhon.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bondhon.com'}/search?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A227 0%, transparent 50%), radial-gradient(circle at 80% 20%, #D4AF37 0%, transparent 40%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(201,162,39,0.15)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }}
          >
            <Star size={12} fill="currentColor" /> {heroBadge}
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-heading, serif)' }}
          >
            {heroTitle.includes('Life Partner') ? (
              <>
                {heroTitle.split('Life Partner')[0]}
                <span style={{ color: '#C9A227' }}>Life Partner</span>
                {heroTitle.split('Life Partner')[1]}
              </>
            ) : heroTitle}
          </h1>

          {/* CMS hero body content — stats, extra text, etc. */}
          {heroContent && (
            <div
              className="prose prose-invert prose-sm max-w-2xl mx-auto mb-8 text-gray-300 [&_strong]:text-[#C9A227] [&_.home-stats]:justify-center"
              dangerouslySetInnerHTML={{ __html: heroContent }}
            />
          )}

          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-base transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)', boxShadow: '0 4px 20px rgba(201,162,39,0.4)' }}
            >
              Create Free Profile <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-base border transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 md:py-20" style={{ background: '#F8F9FB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1F2937', fontFamily: 'var(--font-heading, serif)' }}>
              Why Choose {settings.site_name}?
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              We combine traditional matchmaking values with modern technology to help you find the right partner.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#C9A227] transition-colors duration-200"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(201,162,39,0.1)' }}
                  >
                    <Icon size={22} style={{ color: '#C9A227' }} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1F2937', fontFamily: 'var(--font-heading, serif)' }}>
              How It Works
            </h2>
            <p className="text-gray-500 mt-3">Three simple steps to find your life partner.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-1/2 w-full h-px"
                    style={{ background: 'linear-gradient(to right, #C9A227, transparent)', opacity: 0.4 }}
                  />
                )}
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-white text-lg relative z-10"
                  style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)' }}
                >
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #C9A227 0%, #D4AF37 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <CheckCircle size={48} className="text-white mx-auto mb-5 opacity-90" />
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading, serif)' }}
          >
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-yellow-100 text-lg mb-8">
            Join {settings.site_name} today. Registration is completely free.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-[#C9A227] bg-white text-base transition-transform hover:scale-[1.02]"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
