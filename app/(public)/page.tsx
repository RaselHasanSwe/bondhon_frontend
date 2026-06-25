import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSettings, getPage } from '@/services/publicService';
import type { PageDetail } from '@/types/page';
import {
    Heart, Search, Star, Shield, Users, CheckCircle, ArrowRight,
    BadgeCheck, Zap, MessageCircle, Video, Crown, ChevronRight,
    MapPin, GraduationCap, HandHeart, Sparkles, Lock, PhoneCall,
    Quote, TrendingUp, Award, Clock,
} from 'lucide-react';
import HeroSearchForm from '@/components/public/HeroSearchForm';
import AnimateSection from '@/components/public/AnimateSection';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    return {
        title: settings.meta_title ?? 'Enorsia — Premium Matrimony Platform',
        description: settings.meta_description ?? 'Find your perfect life partner on Enorsia.',
        keywords: settings.meta_keywords ?? 'matrimony, marriage, Bangladesh, bride, groom, matchmaking',
        openGraph: {
            title: settings.meta_title ?? 'Enorsia — Premium Matrimony',
            description: settings.meta_description ?? '',
            type: 'website',
        },
    };
}

/* ─── Static Data ─────────────────────────────────────────────────────────── */

const stats = [
    { value: '50,000+', label: 'Registered Members', icon: Users },
    { value: '12,000+', label: 'Verified Profiles',  icon: BadgeCheck },
    { value: '3,500+',  label: 'Success Stories',    icon: Heart },
    { value: '64',      label: 'Districts Covered',  icon: MapPin },
];

const features = [
    { icon: Shield,        title: 'Verified Profiles',    desc: 'Every profile passes strict NID, photo and email verification before being visible to matches.' },
    { icon: Zap,           title: 'Smart Matching',       desc: 'Our algorithm scores compatibility on religion, education, location, lifestyle, and more.' },
    { icon: Lock,          title: 'Privacy First',        desc: 'Contact details are never shared without consent. You control exactly who sees what.' },
    { icon: Users,         title: 'Trusted Community',    desc: 'Thousands of families across Bangladesh found their perfect match right here.' },
    { icon: MessageCircle, title: 'Secure Chat',          desc: 'Chat privately with mutual connections. No unsolicited messages or spam — ever.' },
    { icon: Video,         title: 'Voice & Video Calls',  desc: 'Gold & Platinum members can make encrypted voice and video calls inside the platform.' },
];

const steps = [
    { step: '01', icon: BadgeCheck, title: 'Create Your Profile',  desc: 'Sign up free. Build a rich profile with photos, preferences, religion, education, and family info.' },
    { step: '02', icon: Search,     title: 'Discover Matches',      desc: 'Browse daily smart suggestions or use advanced filters — age, height, location, career, and more.' },
    { step: '03', icon: HandHeart,  title: 'Send Interest',         desc: "Express interest. Once mutual, both of you unlock private chat and voice calls." },
    { step: '04', icon: Heart,      title: 'Find Your Match',       desc: 'With families connected and hearts aligned, your Enorsia begins — and ours is just the beginning.' },
];

const plans = [
    { name: 'Free',     price: '৳0',     period: 'Forever',  color: '#6B7280', bg: '#fff',
      features: ['10 profile views / day','5 interests / day','Basic search filters','Chat on request only'], cta: 'Get Started',      href: '/register', highlight: false },
    { name: 'Silver',   price: '৳499',   period: '/month',   color: '#9CA3AF', bg: '#fff',
      features: ['Unlimited profile views','20 interests / day','Advanced search','Chat enabled','10 contact views / mo'], cta: 'Choose Silver', href: '/register', highlight: false },
    { name: 'Gold',     price: '৳999',   period: '/month',   color: '#C9A227', bg: 'linear-gradient(160deg,#fffbeb,#fef9e0)',
      features: ['Everything in Silver','50 interests / day','Voice & Video calls','30 contact views / mo','See who liked you'], cta: 'Choose Gold', href: '/register', highlight: true },
    { name: 'Platinum', price: '৳1,799', period: '/month',   color: '#7C3AED', bg: '#fff',
      features: ['Everything in Gold','Unlimited interests','Unlimited contacts','Profile boost (top listing)','Priority support'], cta: 'Choose Platinum', href: '/register', highlight: false },
];

const testimonials = [
    { name: 'Farhan & Nusrat',  location: 'Dhaka',     year: '2024', initials: 'FN', occupation: 'Engineer & Doctor',
      text: 'We met through Enorsia in 2024. The verified profiles gave our families great confidence. Alhamdulillah, we are happily married now — forever grateful!' },
    { name: 'Sabbir & Mitu',    location: 'Chittagong', year: '2024', initials: 'SM', occupation: 'Banker & Teacher',
      text: "Enorsia's smart matching suggested Sabbir to me. We chatted for weeks and our families connected. It was the most natural and respectful process." },
    { name: 'Rakib & Sumaiya',  location: 'Sylhet',    year: '2023', initials: 'RS', occupation: 'Businessman & Designer',
      text: "I was skeptical initially, but the profile verification process built real trust. Found my life partner within 3 months. Will recommend to everyone." },
];

const browseCategories = [
    { icon: '🕌', label: 'Muslim',        query: 'religion=muslim' },
    { icon: '🛕', label: 'Hindu',         query: 'religion=hindu' },
    { icon: '✝️', label: 'Christian',     query: 'religion=christian' },
    { icon: '🎓', label: 'Graduates',     query: 'education=graduate' },
    { icon: '💼', label: 'Professionals', query: 'employed_in=private' },
    { icon: '🌍', label: 'NRB / Abroad',  query: 'country=abroad' },
    { icon: '🏙️', label: 'Dhaka',        query: 'city=dhaka' },
    { icon: '🌊', label: 'Chittagong',    query: 'city=chittagong' },
    { icon: '🌿', label: 'Sylhet',        query: 'city=sylhet' },
    { icon: '🌾', label: 'Rajshahi',      query: 'city=rajshahi' },
];

const trustItems = [
    { icon: Shield,     title: 'NID Verified',    desc: 'NID/Passport document review' },
    { icon: BadgeCheck, title: 'Photo Moderated', desc: 'Admin-approved photos only' },
    { icon: Lock,       title: 'Data Encrypted',  desc: 'TLS encryption on all data' },
    { icon: PhoneCall,  title: '24/7 Support',    desc: 'Dedicated trust & safety team' },
];

const newMembers = [
    { name: 'Ayesha R.', age: 24, city: 'Dhaka',     profession: 'Doctor',      icon: '👩‍⚕️', verified: true  },
    { name: 'Mahfuz K.', age: 28, city: 'Khulna',    profession: 'Engineer',    icon: '👨‍💻', verified: true  },
    { name: 'Tasnim A.', age: 26, city: 'Sylhet',    profession: 'Banker',      icon: '👩‍💼', verified: false },
    { name: 'Rifat H.',  age: 30, city: 'Chittagong',profession: 'Entrepreneur',icon: '👨‍🚀', verified: true  },
    { name: 'Nadia S.',  age: 23, city: 'Rajshahi',  profession: 'Teacher',     icon: '👩‍🏫', verified: true  },
    { name: 'Imran T.',  age: 32, city: 'Dhaka',     profession: 'Lawyer',      icon: '👨‍⚖️', verified: false },
];

const highlights = [
    { icon: Award,    value: '#1',    label: 'Matrimony Platform in Bangladesh' },
    { icon: TrendingUp, value: '98%', label: 'Profile Accuracy Rate' },
    { icon: Clock,    value: '< 3 mo',label: 'Average Match Time' },
    { icon: Heart,    value: '3,500+',label: 'Successful Marriages' },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function HomePage() {
    const settings = await getSettings();

    let heroPage: PageDetail | null = null;
    try { heroPage = await getPage('home_hero'); } catch { /* static fallback */ }

    const heroTitle    = heroPage?.title            ?? 'Find Your Perfect Life Partner';
    const heroBadge    = heroPage?.meta_title       ?? "Bangladesh's Most Trusted Matrimony Platform";
    const heroSubtitle = heroPage?.meta_description ?? settings.meta_description
        ?? `Join thousands of verified profiles. Let ${settings.site_name}'s smart algorithm find your ideal match.`;
    const heroContent  = heroPage?.content          ?? null;

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: settings.site_name, description: settings.meta_description,
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://Enorsia.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://Enorsia.com'}/search?query={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* ══════════════════════════════════════════════════════════════════
                HERO — full-screen photo + layered dark/gold overlay
            ══════════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden min-h-[94vh] flex flex-col justify-center">
                {/* Unsplash photo */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&auto=format&fit=crop&q=80"
                        alt="Happy couple — Enorsia matrimony"
                        fill priority
                        className="object-cover object-center"
                        sizes="100vw"
                    />
                    {/* Primary dark overlay */}
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg,rgba(6,8,18,0.93) 0%,rgba(12,18,36,0.88) 50%,rgba(18,26,55,0.84) 100%)' }} />
                    {/* Gold accent glows */}
                    <div className="hero-blob absolute -top-40 -left-40 h-125 w-125 rounded-full opacity-[0.12]"
                        style={{ background: 'radial-gradient(circle,#C9A227 0%,transparent 70%)' }} />
                    <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full opacity-[0.08]"
                        style={{ background: 'radial-gradient(circle,#D4AF37 0%,transparent 70%)' }} />
                    {/* Bottom fade to site bg */}
                    <div className="absolute bottom-0 left-0 w-full h-32"
                        style={{ background: 'linear-gradient(to top,#F8F9FB,transparent)' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 md:pt-28 md:pb-14 text-center">

                    {/* Badge */}
                    <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
                        style={{ background:'rgba(201,162,39,0.12)', color:'#D4AF37', border:'1px solid rgba(201,162,39,0.3)' }}>
                        <Star size={11} fill="currentColor" /> {heroBadge}
                    </div>

                    {/* H1 */}
                    <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight"
                        style={{ fontFamily:'var(--font-heading,serif)', animationDelay:'80ms' }}>
                        {heroTitle.includes('Life Partner') ? (
                            <>
                                {heroTitle.split('Life Partner')[0]}
                                <span className="text-gold-gradient"> Life Partner</span>
                                {heroTitle.split('Life Partner')[1]}
                            </>
                        ) : heroTitle}
                    </h1>

                    {heroContent && (
                        <div className="animate-fade-in prose prose-invert prose-sm max-w-2xl mx-auto mb-6 text-gray-300 [&_strong]:text-[#C9A227]"
                            dangerouslySetInnerHTML={{ __html: heroContent }}
                            style={{ animationDelay:'160ms' }}
                        />
                    )}

                    <p className="animate-fade-in-up text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
                        style={{ animationDelay:'160ms' }}>
                        {heroSubtitle}
                    </p>

                    {/* CTA buttons */}
                    <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                        style={{ animationDelay:'240ms' }}>
                        <Link href="/register"
                            className="btn-gold hover-shimmer inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-white text-base"
                            style={{ height:'auto' }}>
                            <Sparkles size={17} /> Create Free Profile
                        </Link>
                        <Link href="/search"
                            className="inline-flex items-center gap-2 px-9 py-4 rounded-xl font-semibold text-white text-base border transition-all hover:bg-white/10"
                            style={{ borderColor:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.06)' }}>
                            <Search size={17} /> Browse Profiles
                        </Link>
                    </div>

                    {/* Quick Search */}
                    <div className="animate-fade-in-up" style={{ animationDelay:'320ms' }}>
                        <HeroSearchForm />
                    </div>

                    {/* Stats bar */}
                    <div className="animate-fade-in-up mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
                        style={{ border:'1px solid rgba(201,162,39,0.15)', background:'rgba(201,162,39,0.06)', animationDelay:'400ms' }}>
                        {stats.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className="py-6 px-4 group"
                                    style={{ background:'rgba(6,8,18,0.65)' }}>
                                    <Icon size={16} className="mx-auto mb-1.5 opacity-60" style={{ color:'#C9A227' }} />
                                    <p className="text-2xl md:text-3xl font-black" style={{ color:'#C9A227' }}>{s.value}</p>
                                    <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float hidden sm:block">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
                        <div className="w-1 h-2.5 rounded-full bg-white/40 animate-bounce" />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                HIGHLIGHTS BAND
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section style={{ background:'linear-gradient(135deg,#C9A227 0%,#D4AF37 50%,#B8931F 100%)' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
                            {highlights.map((h) => {
                                const Icon = h.icon;
                                return (
                                    <div key={h.label} className="text-center animate-fade-in-up">
                                        <Icon size={20} className="mx-auto mb-2 text-white opacity-80" />
                                        <p className="text-2xl md:text-3xl font-black text-white">{h.value}</p>
                                        <p className="text-yellow-100 text-xs mt-0.5 leading-snug">{h.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                QUICK BROWSE BAND
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-12" style={{ background:'#F8F9FB' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-xs font-bold uppercase tracking-widest mb-6" style={{ color:'#C9A227' }}>
                            Browse Profiles By
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {browseCategories.map((cat) => (
                                <Link key={cat.label} href={`/search?${cat.query}`}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border text-sm font-medium text-gray-700 hover:border-[#C9A227] hover:text-[#C9A227] hover:-translate-y-0.5 transition-all duration-150"
                                    style={{ borderColor:'#E5E7EB', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <span>{cat.icon}</span> {cat.label}
                                </Link>
                            ))}
                            <Link href="/search"
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white hover-shimmer"
                                style={{ background:'linear-gradient(135deg,#C9A227,#D4AF37)' }}>
                                All Filters <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                FEATURES
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#C9A227' }}>Platform Benefits</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Why Families Choose {settings.site_name}
                            </h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
                                We combine traditional values with modern technology — giving families a safe, private, intelligent matchmaking platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.title}
                                        className="group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#C9A227] hover:shadow-xl transition-all duration-250 animate-fade-in-up"
                                        style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                                            style={{ background:'rgba(201,162,39,0.1)' }}>
                                            <Icon size={22} style={{ color:'#C9A227' }} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-2 text-base">{f.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                                        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full rounded-b-2xl transition-all duration-500"
                                            style={{ background:'linear-gradient(to right,#C9A227,#D4AF37)' }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                NEW MEMBERS PREVIEW
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-20" style={{ background:'#F8F9FB' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:'#C9A227' }}>New Registrations</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Newly Joined Members</h2>
                            </div>
                            <Link href="/search"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
                                style={{ color:'#C9A227' }}>
                                View All Profiles <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
                            {newMembers.map((m) => (
                                <Link key={m.name} href="/search"
                                    className="group bg-white rounded-2xl p-4 border border-gray-100 text-center hover:border-[#C9A227] hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200 animate-fade-in-up"
                                    style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div className="relative mx-auto mb-3 inline-block">
                                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-300"
                                            style={{ background:'linear-gradient(135deg,#FDF3CC,#FAE495)' }}>
                                            {m.icon}
                                        </div>
                                        {m.verified && (
                                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
                                                style={{ background:'linear-gradient(135deg,#C9A227,#D4AF37)' }}>
                                                <BadgeCheck size={11} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-semibold text-gray-800 text-sm">{m.name}</p>
                                    <p className="text-gray-400 text-xs">{m.age} · {m.city}</p>
                                    <p className="text-xs mt-0.5 font-medium" style={{ color:'#C9A227' }}>{m.profession}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24" style={{ background:'linear-gradient(135deg,#0d1117,#161b27)' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#C9A227' }}>Simple Process</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Journey to a Perfect Match</h2>
                            <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm">
                                Four steps — from sign-up to finding the one — guided entirely by our secure, smart platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
                            {steps.map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.step} className="relative animate-fade-in-up">
                                        {i < steps.length - 1 && (
                                            <div className="hidden lg:block absolute top-10 left-full w-full h-px z-0 pointer-events-none"
                                                style={{ background:'linear-gradient(to right,rgba(201,162,39,0.4),transparent)' }} />
                                        )}
                                        <div className="step-card relative z-10 rounded-2xl p-6 h-full border"
                                            style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(201,162,39,0.15)' }}>
                                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 font-black text-white text-lg"
                                                style={{ background:'linear-gradient(135deg,#C9A227,#D4AF37)' }}>
                                                {s.step}
                                            </div>
                                            <Icon size={20} style={{ color:'#C9A227' }} className="mb-3" />
                                            <h3 className="font-bold text-white mb-2 text-sm">{s.title}</h3>
                                            <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-center mt-12">
                            <Link href="/register"
                                className="btn-gold hover-shimmer inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-white text-base"
                                style={{ height:'auto' }}>
                                Start for Free — It takes 2 minutes <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                TRUST & SAFETY
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-14 bg-white border-y border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10">
                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'#C9A227' }}>Safety First</p>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Safety is Our Priority</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
                            {trustItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="text-center group animate-fade-in-up">
                                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-pulse transition-transform duration-300 group-hover:scale-110"
                                            style={{ background:'rgba(201,162,39,0.1)' }}>
                                            <Icon size={26} style={{ color:'#C9A227' }} />
                                        </div>
                                        <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                                        <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                SUBSCRIPTION PLANS
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24" style={{ background:'#F8F9FB' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#C9A227' }}>Membership Plans</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Choose the Right Plan for You</h2>
                            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm">
                                Start free. Upgrade at any time. All paid plans include priority matching and verified contact access.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
                            {plans.map((plan) => (
                                <div key={plan.name}
                                    className="plan-card-gold relative rounded-2xl p-6 border flex flex-col animate-fade-in-up"
                                    style={{
                                        borderColor: plan.highlight ? '#C9A227' : '#E5E7EB',
                                        background: plan.bg,
                                        boxShadow: plan.highlight ? '0 8px 32px rgba(201,162,39,0.18)' : '0 2px 8px rgba(0,0,0,0.04)',
                                    }}>
                                    {plan.highlight && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                                            style={{ background:'linear-gradient(135deg,#C9A227,#D4AF37)' }}>
                                            ⭐ Most Popular
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-4 mt-2">
                                        <Crown size={18} style={{ color:plan.color }} />
                                        <span className="font-bold text-gray-800 text-lg">{plan.name}</span>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-3xl font-black" style={{ color:plan.color }}>{plan.price}</span>
                                        <span className="text-gray-400 text-sm ml-1.5">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-2.5 flex-1 mb-6">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color:plan.color }} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={plan.href}
                                        className="hover-shimmer block text-center py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200"
                                        style={
                                            plan.highlight
                                                ? { background:'linear-gradient(135deg,#C9A227,#D4AF37)', color:'#fff', boxShadow:'0 4px 14px rgba(201,162,39,0.35)' }
                                                : { border:`1.5px solid ${plan.color}`, color:plan.color, background:'transparent' }
                                        }>
                                        {plan.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-8">
                            Billed monthly in BDT via SSLCommerz · Secure payment · Cancel anytime
                        </p>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                SUCCESS STORIES
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#C9A227' }}>Real Couples</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    3,500+ Couples Found Their Match Here
                                </h2>
                                <p className="text-gray-500 mt-2 text-sm max-w-lg">
                                    Families across Bangladesh trust {settings.site_name}. Read some of their stories.
                                </p>
                            </div>
                            <Link href="/success-stories"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
                                style={{ color:'#C9A227' }}>
                                View All Stories <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
                            {testimonials.map((t) => (
                                <div key={t.name}
                                    className="testimonial-card bg-white rounded-2xl p-7 border border-gray-100 flex flex-col gap-4 animate-fade-in-up"
                                    style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                                    <Quote size={28} style={{ color:'#C9A227', opacity:0.35 }} />
                                    <p className="text-gray-600 text-sm leading-relaxed flex-1">{t.text}</p>
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                                            style={{ background:'linear-gradient(135deg,#C9A227,#D4AF37)' }}>
                                            {t.initials}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                                            <p className="text-xs text-gray-400">{t.occupation}</p>
                                            <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                                <MapPin size={9} /> {t.location} · {t.year}
                                            </p>
                                        </div>
                                        <div className="ml-auto flex flex-col items-end gap-0.5">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={11} fill="#C9A227" style={{ color:'#C9A227' }} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400">Verified Couple</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                PROFILE PREVIEW BAND
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-20" style={{ background:'linear-gradient(135deg,#0d1117,#1a2744)' }}>
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background:'rgba(201,162,39,0.12)', color:'#C9A227', border:'1px solid rgba(201,162,39,0.25)' }}>
                            <GraduationCap size={12} /> Educated · Verified · From All 64 Districts
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                            Over <span style={{ color:'#C9A227' }}>12,000 Verified</span> Profiles Waiting
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
                            Doctors, engineers, teachers, bankers, entrepreneurs — from Dhaka to Sylhet, Rajshahi to Chattogram.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                            {[
                                { label: 'Doctor · 28 · Dhaka',       icon: '👩‍⚕️' },
                                { label: 'Engineer · 30 · Chittagong', icon: '👨‍💻' },
                                { label: 'Teacher · 26 · Sylhet',      icon: '👩‍🏫' },
                                { label: 'Banker · 31 · Rajshahi',     icon: '👨‍💼' },
                                { label: 'Designer · 27 · Khulna',     icon: '👩‍🎨' },
                                { label: 'Entrepreneur · 33 · Dhaka',  icon: '👨‍🚀' },
                                { label: 'Lawyer · 29 · Cumilla',      icon: '👩‍⚖️' },
                                { label: 'Professor · 35 · Barishal',  icon: '👨‍🏫' },
                            ].map((p) => (
                                <div key={p.label}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white transition-all hover:border-[#C9A227] cursor-default"
                                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                                    <span>{p.icon}</span> {p.label}
                                </div>
                            ))}
                        </div>
                        <Link href="/search"
                            className="btn-gold hover-shimmer inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-white text-sm"
                            style={{ height:'auto' }}>
                            Browse All Profiles <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                FAQ SNIPPETS
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-20 bg-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'#C9A227' }}>FAQ</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Common Questions</h2>
                            <p className="text-gray-500 mt-2 text-sm">Everything you need to know before joining.</p>
                        </div>
                        <div className="space-y-3 stagger">
                            {[
                                { q: 'Is Enorsia free to use?',
                                  a: 'Yes! Creating a profile and browsing matches is 100% free. Premium plans unlock contact views, voice/video calls, and profile boosts.' },
                                { q: 'How does profile verification work?',
                                  a: 'Members submit NID or passport plus a selfie. Our admin team manually verifies every document before approving the profile.' },
                                { q: 'Is my personal information safe?',
                                  a: 'Absolutely. Phone numbers and emails are never shown publicly. Contact info is only revealed to mutual connections per your privacy settings.' },
                                { q: 'Can I search by religion, location, or profession?',
                                  a: 'Yes — filter by religion, caste, education, profession, income, district, city, age, height, and much more in advanced search.' },
                                { q: 'How do I start a conversation?',
                                  a: 'Send an interest. When accepted, both of you unlock private chat. Gold/Platinum members can also make voice and video calls.' },
                            ].map((faq) => (
                                <div key={faq.q}
                                    className="faq-card rounded-xl border border-gray-100 p-5 animate-fade-in-up"
                                    style={{ boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                                    <p className="font-semibold text-gray-800 text-sm mb-1.5">🔹 {faq.q}</p>
                                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <Link href="/faq"
                                className="text-sm font-semibold inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                style={{ color:'#C9A227' }}>
                                See All FAQs <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                FINAL CTA BANNER
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="relative overflow-hidden py-24"
                    style={{ background:'linear-gradient(135deg,#C9A227 0%,#D4AF37 55%,#B8931F 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage:'radial-gradient(circle at 10% 50%,#fff 0%,transparent 55%),radial-gradient(circle at 90% 20%,#fff 0%,transparent 45%)' }} />
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                            style={{ background:'rgba(255,255,255,0.2)' }}>
                            <Heart size={36} className="text-white" fill="white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Begin Your Journey Today</h2>
                        <p className="text-yellow-100 text-base mb-10 max-w-md mx-auto leading-relaxed">
                            Join {settings.site_name} — registration is completely free. Thousands of verified families are waiting to find the right match.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Link href="/register"
                                className="hover-shimmer inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-white text-base transition-all hover:scale-[1.02]"
                                style={{ color:'#C9A227', boxShadow:'0 6px 24px rgba(0,0,0,0.18)' }}>
                                <Sparkles size={17} /> Get Started — It&apos;s Free
                            </Link>
                            <Link href="/about"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/40 hover:bg-white/10 transition-colors">
                                Learn More <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-yellow-100 text-xs">
                            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="opacity-80" /> Free Registration</span>
                            <span className="flex items-center gap-1.5"><Shield size={13} className="opacity-80" /> 100% Verified Profiles</span>
                            <span className="flex items-center gap-1.5"><Lock size={13} className="opacity-80" /> Secure & Private</span>
                            <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="opacity-80" /> 50,000+ Members</span>
                        </div>
                    </div>
                </section>
            </AnimateSection>
        </>
    );
}
