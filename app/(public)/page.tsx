import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {getSettings, getPage, getRecentMembers} from '@/services/publicService';
import type {PageDetail} from '@/types/page';
import {
    Heart, Search, Star, Shield, Users, CheckCircle, ArrowRight,
    BadgeCheck, Zap, MessageCircle, Video, Crown, ChevronRight,
    MapPin, GraduationCap, HandHeart, Sparkles, Lock, PhoneCall,
    Quote,
} from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';
import NewMembersPreview from '@/components/public/NewMembersPreview';

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

const platformFeatures = [
    {icon: BadgeCheck, label: 'Verified Member Profiles'},
    {icon: Lock, label: 'Secure & Private Platform'},
    {icon: HandHeart, label: 'Family-Friendly Matchmaking'},
    {icon: Search, label: 'Smart Search & Filters'},
    {icon: Crown, label: 'Subscription-Based Premium Features'},
    {icon: PhoneCall, label: 'Dedicated Customer Support'},
];

const features = [
    {
        icon: Shield,
        title: 'Verified Profiles',
        desc: 'Every profile passes strict NID, photo and email verification before being visible to matches.'
    },
    {
        icon: Zap,
        title: 'Smart Matching',
        desc: 'Our algorithm scores compatibility on religion, education, location, lifestyle, and more.'
    },
    {
        icon: Lock,
        title: 'Privacy First',
        desc: 'Contact details are never shared without consent. You control exactly who sees what.'
    },
    {
        icon: Users,
        title: 'Trusted Community',
        desc: 'Thousands of families across Bangladesh found their perfect match right here.'
    },
    {
        icon: MessageCircle,
        title: 'Secure Chat',
        desc: 'Chat privately with mutual connections. No unsolicited messages or spam — ever.'
    },
    {
        icon: Video,
        title: 'Voice & Video Calls',
        desc: 'Gold & Platinum members can make encrypted voice and video calls inside the platform.'
    },
];

const steps = [
    {
        step: '01',
        icon: BadgeCheck,
        title: 'Create Your Profile',
        desc: 'Sign up free. Build a rich profile with photos, preferences, religion, education, and family info.'
    },
    {
        step: '02',
        icon: Search,
        title: 'Discover Matches',
        desc: 'Browse daily smart suggestions or use advanced filters — age, height, location, career, and more.'
    },
    {
        step: '03',
        icon: HandHeart,
        title: 'Send Interest',
        desc: "Express interest. Once mutual, both of you unlock private chat and voice calls."
    },
    {
        step: '04',
        icon: Heart,
        title: 'Find Your Match',
        desc: 'With families connected and hearts aligned, your Enorsia begins — and ours is just the beginning.'
    },
];

const plans = [
    {
        name: 'Free',
        price: '৳0',
        period: 'Forever',
        color: '#6B7280',
        bg: '#fff',
        features: ['10 profile views / day', '5 interests / day', 'Basic search filters', 'Chat on request only'],
        cta: 'Get Started',
        href: '/register',
        highlight: false
    },
    {
        name: 'Silver',
        price: '৳499',
        period: '/month',
        color: '#9CA3AF',
        bg: '#fff',
        features: ['Unlimited profile views', '20 interests / day', 'Advanced search', 'Chat enabled', '10 contact views / mo'],
        cta: 'Choose Silver',
        href: '/register',
        highlight: false
    },
    {
        name: 'Gold',
        price: '৳999',
        period: '/month',
        color: '#C9A227',
        bg: 'linear-gradient(160deg,#fffbeb,#fef9e0)',
        features: ['Everything in Silver', '50 interests / day', 'Voice & Video calls', '30 contact views / mo', 'See who liked you'],
        cta: 'Choose Gold',
        href: '/register',
        highlight: true
    },
    {
        name: 'Platinum',
        price: '৳1,799',
        period: '/month',
        color: '#7C3AED',
        bg: '#fff',
        features: ['Everything in Gold', 'Unlimited interests', 'Unlimited contacts', 'Profile boost (top listing)', 'Priority support'],
        cta: 'Choose Platinum',
        href: '/register',
        highlight: false
    },
];

const testimonials = [
    {
        name: 'Farhan & Nusrat', location: 'Dhaka', year: '2024', initials: 'FN', occupation: 'Engineer & Doctor',
        text: 'We met through Enorsia in 2024. The verified profiles gave our families great confidence. Alhamdulillah, we are happily married now — forever grateful!'
    },
    {
        name: 'Sabbir & Mitu', location: 'Chittagong', year: '2024', initials: 'SM', occupation: 'Banker & Teacher',
        text: "Enorsia's smart matching suggested Sabbir to me. We chatted for weeks and our families connected. It was the most natural and respectful process."
    },
    {
        name: 'Rakib & Sumaiya', location: 'Sylhet', year: '2023', initials: 'RS', occupation: 'Businessman & Designer',
        text: "I was skeptical initially, but the profile verification process built real trust. Found my life partner within 3 months. Will recommend to everyone."
    },
];

const browseCategories = [
    {icon: '🕌', label: 'Muslim', query: 'religion=muslim'},
    {icon: '🛕', label: 'Hindu', query: 'religion=hindu'},
    {icon: '✝️', label: 'Christian', query: 'religion=christian'},
    {icon: '🎓', label: 'Graduates', query: 'education=graduate'},
    {icon: '💼', label: 'Professionals', query: 'employed_in=private'},
    {icon: '🌍', label: 'NRB / Abroad', query: 'country=abroad'},
    {icon: '🏙️', label: 'Dhaka', query: 'city=dhaka'},
    {icon: '🌊', label: 'Chittagong', query: 'city=chittagong'},
    {icon: '🌿', label: 'Sylhet', query: 'city=sylhet'},
    {icon: '🌾', label: 'Rajshahi', query: 'city=rajshahi'},
];

const trustItems = [
    {icon: Shield, title: 'Face Verified', desc: 'Profiles verified with live face scan'},
    {icon: BadgeCheck, title: 'Photo Moderated', desc: 'Admin-approved photos only'},
    {icon: Lock, title: 'Data Encrypted', desc: 'TLS encryption on all data'},
    {icon: PhoneCall, title: '24/7 Support', desc: 'Dedicated trust & safety team'},
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function HomePage() {
    const [settings, recentMembers] = await Promise.all([
        getSettings(),
        getRecentMembers(),
    ]);

    let heroPage: PageDetail | null = null;
    try {
        heroPage = await getPage('home_hero');
    } catch { /* static fallback */
    }

    const heroTitle = 'Find Your Perfect Life Partner';
    const heroBadge = "Premium Matrimony Platform";
    const heroSubtitle = heroPage?.meta_description ?? settings.meta_description
        ?? `Join thousands of verified profiles. Let ${settings.site_name}'s smart algorithm find your ideal match.`;
    const heroContent = "Connect with genuine and verified profiles through a secure matrimony platform designed to help individuals and families build meaningful relationships.";

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
            <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}/>

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
                         style={{background: 'linear-gradient(135deg,rgba(6,8,18,0.93) 0%,rgba(12,18,36,0.88) 50%,rgba(18,26,55,0.84) 100%)'}}/>
                    {/* Gold accent glows */}
                    <div className="hero-blob absolute -top-40 -left-40 h-125 w-125 rounded-full opacity-[0.12]"
                         style={{background: 'radial-gradient(circle,#C9A227 0%,transparent 70%)'}}/>
                    <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full opacity-[0.08]"
                         style={{background: 'radial-gradient(circle,#D4AF37 0%,transparent 70%)'}}/>
                    {/* Bottom fade to site bg */}
                    <div className="absolute bottom-0 left-0 w-full h-32"
                         style={{background: 'linear-gradient(to top,#1f1f1fc4,transparent)'}}/>
                </div>

                {/* Content */}
                <div
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-10 md:pt-15 md:pb-14 text-center">

                    {/* Badge */}
                    <div
                        className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
                        style={{
                            background: 'rgba(201,162,39,0.12)',
                            color: '#D4AF37',
                            border: '1px solid rgba(201,162,39,0.3)'
                        }}>{heroBadge}
                    </div>

                    {/* H1 */}
                    <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight"
                        style={{fontFamily: 'var(--font-heading,serif)', animationDelay: '80ms'}}>
                        {heroTitle.includes('Life Partner') ? (
                            <>
                                {heroTitle.split('Life Partner')[0]}
                                <span className="text-gold-gradient"> Life Partner</span>
                                {heroTitle.split('Life Partner')[1]}
                            </>
                        ) : heroTitle}
                    </h1>

                    {heroContent && (
                        <div
                            className="animate-fade-in prose prose-invert prose-sm max-w-2xl mx-auto mb-8 text-gray-300 [&_strong]:text-[#C9A227]"
                            dangerouslySetInnerHTML={{__html: heroContent}}
                            style={{animationDelay: '160ms'}}
                        />
                    )}

                    {/* Feature Highlights */}
                    <div
                        className="animate-fade-in-up flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 max-w-3xl mx-auto"
                        style={{animationDelay: '200ms'}}>
                        {[
                            {label: 'Verified Profiles'},
                            {label: 'Smart Match Suggestions'},
                            {label: 'Privacy & Security'},
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-sm font-medium text-gray-200 transition-all duration-200 hover:border-[#C9A227]/50 hover:bg-white/[0.08]"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(201,162,39,0.2)',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                }}>
                                <CheckCircle size={15} className="shrink-0" style={{color: '#C9A227'}}/>
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <p
                        className="animate-fade-in-up text-lg sm:text-xl md:text-2xl font-semibold text-white mb-7 tracking-tight"
                        style={{fontFamily: 'var(--font-heading,serif)', animationDelay: '240ms'}}>
                        Start Your Journey Today
                    </p>

                    {/* CTA buttons */}
                    <div
                        className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                        style={{animationDelay: '280ms'}}>
                        <Link href="/register"
                              className="btn-gold hover-shimmer inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-bold text-white text-base min-h-[3.25rem] min-w-[220px] sm:min-w-0"
                              style={{height: 'auto'}}>
                            <Sparkles size={17}/> Create Free Profile
                        </Link>
                        <Link href="/search"
                              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-semibold text-white text-base border transition-all hover:bg-white/10 min-h-[3.25rem] min-w-[220px] sm:min-w-0"
                              style={{borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', height: 'auto'}}>
                            <Search size={17}/> Browse Profiles
                        </Link>
                    </div>

                    {/* Profile Discovery Section */}
                    <div
                        className="animate-fade-in-up mb-10 max-w-3xl mx-auto w-full"
                        style={{animationDelay: '340ms'}}>
                        <div
                            className="rounded-2xl px-6 py-8 sm:px-10 sm:py-10 text-center"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(201,162,39,0.22)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            }}>
                            <h2
                                className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight"
                                style={{fontFamily: 'var(--font-heading,serif)'}}>
                                Explore Matrimony Profiles
                            </h2>
                            <p className="text-base sm:text-lg font-medium text-gray-200 mb-3">
                                Looking for a Bride or Groom?
                            </p>
                            <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">
                                Browse verified profiles based on age, religion, education, profession, and location to find compatible matches.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                <Link
                                    href="/search?gender=female"
                                    className="group flex flex-col items-center gap-3 rounded-xl px-6 py-5 transition-all duration-200 hover:-translate-y-1"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(201,162,39,0.18) 0%, rgba(212,175,55,0.08) 100%)',
                                        border: '1px solid rgba(201,162,39,0.35)',
                                        boxShadow: '0 4px 20px rgba(201,162,39,0.12)',
                                    }}>
                                    <span
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110"
                                        style={{background: 'rgba(201,162,39,0.15)'}}>
                                        👰
                                    </span>
                                    <span className="font-bold text-white text-base">Browse Bride Profiles</span>
                                </Link>
                                <Link
                                    href="/search?gender=male"
                                    className="group flex flex-col items-center gap-3 rounded-xl px-6 py-5 transition-all duration-200 hover:-translate-y-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    }}>
                                    <span
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110"
                                        style={{background: 'rgba(255,255,255,0.08)'}}>
                                        🤵
                                    </span>
                                    <span className="font-bold text-white text-base">Browse Groom Profiles</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float hidden sm:block">
                    <div
                        className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
                        <div className="w-1 h-2.5 rounded-full bg-white/40 animate-bounce"/>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                PLATFORM FEATURES
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section style={{background: 'linear-gradient(135deg,#C9A227 0%,#D4AF37 50%,#B8931F 100%)'}}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger">
                            {platformFeatures.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.label}
                                        className="flex items-center gap-3 rounded-xl px-5 py-4 animate-fade-in-up transition-all duration-200 hover:bg-white/20"
                                        style={{
                                            background: 'rgba(255,255,255,0.12)',
                                            border: '1px solid rgba(255,255,255,0.22)',
                                        }}>
                                        <CheckCircle size={18} className="shrink-0 text-white opacity-90"/>
                                        <Icon size={17} className="shrink-0 text-white opacity-75"/>
                                        <span className="text-sm sm:text-base font-semibold text-white leading-snug">
                                            {f.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            <AnimateSection>
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs font-bold uppercase tracking-widest mb-3"
                               style={{color: '#C9A227'}}>Platform Benefits</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Why Families Choose {settings.site_name}
                            </h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
                                We combine traditional values with modern technology — giving families a safe, private,
                                intelligent matchmaking platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.title}
                                         className="group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#C9A227] hover:shadow-xl transition-all duration-250 animate-fade-in-up"
                                         style={{boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
                                        <div
                                            className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                                            style={{background: 'rgba(201,162,39,0.1)'}}>
                                            <Icon size={22} style={{color: '#C9A227'}}/>
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-2 text-base">{f.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                                        <div
                                            className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full rounded-b-2xl transition-all duration-500"
                                            style={{background: 'linear-gradient(to right,#C9A227,#D4AF37)'}}/>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            <NewMembersPreview members={recentMembers}/>

            {/* ══════════════════════════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24" style={{background: 'linear-gradient(135deg,#0d1117,#161b27)'}}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs font-bold uppercase tracking-widest mb-3"
                               style={{color: '#C9A227'}}>Simple Process</p>
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
                                            <div
                                                className="hidden lg:block absolute top-10 left-full w-full h-px z-0 pointer-events-none"
                                                style={{background: 'linear-gradient(to right,rgba(201,162,39,0.4),transparent)'}}/>
                                        )}
                                        <div className="step-card relative z-10 rounded-2xl p-6 h-full border"
                                             style={{
                                                 background: 'rgba(255,255,255,0.04)',
                                                 borderColor: 'rgba(201,162,39,0.15)'
                                             }}>
                                            <div
                                                className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 font-black text-white text-lg"
                                                style={{background: 'linear-gradient(135deg,#C9A227,#D4AF37)'}}>
                                                {s.step}
                                            </div>
                                            <Icon size={20} style={{color: '#C9A227'}} className="mb-3"/>
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
                                  style={{height: 'auto'}}>
                                Start for Free — It takes 2 minutes <ArrowRight size={16}/>
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
                            <p className="text-xs font-bold uppercase tracking-widest mb-2"
                               style={{color: '#C9A227'}}>Safety First</p>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Safety is Our Priority</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
                            {trustItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="text-center group animate-fade-in-up">
                                        <div
                                            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-pulse transition-transform duration-300 group-hover:scale-110"
                                            style={{background: 'rgba(201,162,39,0.1)'}}>
                                            <Icon size={26} style={{color: '#C9A227'}}/>
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
                FINAL CTA BANNER
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="relative overflow-hidden py-24"
                         style={{background: 'linear-gradient(135deg,#C9A227 0%,#D4AF37 55%,#B8931F 100%)'}}>
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                         style={{backgroundImage: 'radial-gradient(circle at 10% 50%,#fff 0%,transparent 55%),radial-gradient(circle at 90% 20%,#fff 0%,transparent 45%)'}}/>
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <div
                            className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                            style={{background: 'rgba(255,255,255,0.2)'}}>
                            <Heart size={36} className="text-white" fill="white"/>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Begin Your Journey Today</h2>
                        <p className="text-yellow-100 text-base mb-10 max-w-md mx-auto leading-relaxed">
                            Join {settings.site_name} — registration is completely free. Thousands of verified families
                            are waiting to find the right match.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Link href="/register"
                                  className="hover-shimmer inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-white text-base transition-all hover:scale-[1.02]"
                                  style={{color: '#C9A227', boxShadow: '0 6px 24px rgba(0,0,0,0.18)'}}>
                                <Sparkles size={17}/> Get Started — It&apos;s Free
                            </Link>
                            <Link href="/about"
                                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/40 hover:bg-white/10 transition-colors">
                                Learn More <ArrowRight size={16}/>
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-yellow-100 text-xs">
                            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="opacity-80"/> Free Registration</span>
                            <span className="flex items-center gap-1.5"><Shield size={13} className="opacity-80"/> 100% Verified Profiles</span>
                            <span className="flex items-center gap-1.5"><Lock size={13} className="opacity-80"/> Secure & Private</span>
                            <span className="flex items-center gap-1.5"><HandHeart size={13} className="opacity-80"/> Family-Friendly</span>
                        </div>
                    </div>
                </section>
            </AnimateSection>
        </>
    );
}
