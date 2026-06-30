import type { Metadata } from 'next';
import { getSettings, getSubscriptionPlans } from '@/services/publicService';
import PricingPageContent from '@/components/public/PricingPageContent';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    return {
        title: `Pricing & Plans — ${settings.site_name}`,
        description: `Compare membership plans on ${settings.site_name}. Start free and upgrade to unlock premium matchmaking features.`,
        openGraph: {
            title: `Pricing & Plans — ${settings.site_name}`,
            description: `Transparent pricing for ${settings.site_name} matrimony memberships.`,
            type: 'website',
        },
    };
}

export default async function PlanPage() {
    const [settings, { plans, feature_definitions }] = await Promise.all([
        getSettings(),
        getSubscriptionPlans(),
    ]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Pricing — ${settings.site_name}`,
        description: `Membership plans and pricing for ${settings.site_name}`,
        offers: plans.map((plan) => ({
            '@type': 'Offer',
            name: plan.name,
            price: plan.price_bdt,
            priceCurrency: settings.currency ?? 'BDT',
            description: plan.description,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PricingPageContent
                plans={plans}
                settings={settings}
                featureDefinitions={feature_definitions}
            />
        </>
    );
}
