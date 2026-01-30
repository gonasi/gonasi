import { useState } from 'react';

import type { Route } from './+types/pricing';

import { NotFoundCard } from '~/components/cards';
import { createClient } from '~/lib/supabase/supabase.server';
import { generateMetaTags } from '~/utils/seo';

export function meta() {
  const siteUrl = 'https://gonasi.com';

  return generateMetaTags(
    {
      title: 'Gonasi Pricing - Build Interactive Learning | Kahoot Alternative Plans',
      description:
        'Affordable pricing for creators to build interactive learning. Gonasi offers creator-friendly plans as a Kahoot alternative and Brilliant.org-style course builder. Tools to build gamified quizzes, interactive courses, and live audience experiences. Free plans available for educators and organizations.',
      keywords:
        'gonasi pricing, build interactive learning pricing, kahoot alternative pricing, course builder pricing, interactive learning creator tools pricing, gamified quiz builder pricing, live quiz platform pricing, brilliant.org alternative pricing, free course builder, affordable creator platform',
      url: `${siteUrl}/pricing`,
      type: 'website',
    },
    siteUrl,
  );
}

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { data } = await supabase.from('tier_limits').select();

  return data;
}

type TierData = NonNullable<Route.ComponentProps['loaderData']>[number];

const tierConfig = {
  launch: {
    name: '🚀 Launch',
    description: 'Perfect for getting started with your first courses',
    icon: '🚀',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-200',
    popular: false,
  },
  scale: {
    name: '📈 Scale',
    description: 'For growing businesses ready to expand their reach',
    icon: '📈',
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-300',
    popular: true,
  },
  impact: {
    name: '⚡ Impact',
    description: 'For established organizations maximizing their impact',
    icon: '⚡',
    color: 'from-orange-500 to-rose-600',
    borderColor: 'border-orange-300',
    popular: false,
  },
  temp: {
    name: '🔧 Temp',
    description: 'Temporary tier',
    icon: '🔧',
    color: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-300',
    popular: false,
  },
};

function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(0)} GB`;
  }
  return `${mb} MB`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function PricingCard({ tier, isYearly }: { tier: TierData; isYearly: boolean }) {
  const config = tierConfig[tier.tier as keyof typeof tierConfig];
  const price = isYearly ? tier.price_yearly_usd / 12 : tier.price_monthly_usd;
  const yearlyPrice = tier.price_yearly_usd;
  const monthlySavings =
    isYearly && tier.price_monthly_usd > 0
      ? (
          ((tier.price_monthly_usd * 12 - tier.price_yearly_usd) / (tier.price_monthly_usd * 12)) *
          100
        ).toFixed(0)
      : 0;

  const features = [
    {
      label: `${tier.max_members_per_org} team member${tier.max_members_per_org !== 1 ? 's' : ''}`,
      highlight: true,
    },
    {
      label: `${tier.max_free_courses_per_org} free course${tier.max_free_courses_per_org !== 1 ? 's' : ''}`,
      highlight: true,
    },
    {
      label: `${formatStorage(tier.storage_limit_mb_per_org)} storage`,
      highlight: false,
    },
    {
      label: tier.ai_tools_enabled
        ? `${formatNumber(tier.ai_usage_limit_monthly)} AI credits/month`
        : 'No AI tools',
      highlight: tier.ai_tools_enabled,
      disabled: !tier.ai_tools_enabled,
    },
    {
      label: tier.custom_domains_enabled
        ? `${tier.max_custom_domains} custom domain${tier.max_custom_domains !== 1 ? 's' : ''}`
        : 'No custom domains',
      highlight: tier.custom_domains_enabled,
      disabled: !tier.custom_domains_enabled,
    },
    {
      label: `${tier.analytics_level.charAt(0).toUpperCase() + tier.analytics_level.slice(1)} analytics`,
      highlight: tier.analytics_level === 'advanced',
    },
    {
      label: `${tier.support_level.charAt(0).toUpperCase() + tier.support_level.slice(1)} support`,
      highlight: tier.support_level === 'priority',
    },
    {
      label: `${tier.platform_fee_percentage}% platform fee`,
      highlight: tier.platform_fee_percentage <= 8,
    },
  ];

  if (tier.white_label_enabled) {
    features.push({
      label: 'White label branding',
      highlight: true,
    });
  }

  return (
    <div
      className={`group relative rounded-3xl bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl ${
        config.popular ? 'ring-opacity-50 scale-105 ring-4 ring-violet-500' : ''
      }`}
      style={{
        animationDelay: `${Object.keys(tierConfig).indexOf(tier.tier) * 100}ms`,
      }}
    >
      {config.popular && (
        <div
          className={`absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r ${config.color} px-6 py-2 text-sm font-bold tracking-wide text-white uppercase shadow-lg`}
        >
          Most Popular
        </div>
      )}

      <div className='mb-6'>
        <div className='mb-3 flex items-center gap-3'>
          <span className='text-4xl'>{config.icon}</span>
          <h3 className='text-3xl font-bold tracking-tight text-gray-900'>
            {config.name.replace(/^[^\s]+\s/, '')}
          </h3>
        </div>
        <p className='text-base text-gray-600'>{config.description}</p>
      </div>

      <div className='mb-8'>
        <div className='flex items-baseline gap-2'>
          <span className='text-5xl font-black tracking-tight text-gray-900'>
            ${price.toFixed(0)}
          </span>
          <span className='text-lg text-gray-500'>/month</span>
        </div>
        {isYearly && monthlySavings > 0 && (
          <p className='mt-2 text-sm font-semibold text-emerald-600'>
            Save ${(tier.price_monthly_usd * 12 - yearlyPrice).toFixed(0)} yearly ({monthlySavings}%
            off)
          </p>
        )}
        {!isYearly && tier.price_yearly_usd > 0 && (
          <p className='mt-2 text-sm text-gray-500'>${yearlyPrice}/year billed annually</p>
        )}
      </div>

      <ul className='space-y-4'>
        {features.map((feature, idx) => (
          <li
            key={idx}
            className={`flex items-start gap-3 text-sm ${feature.disabled ? 'opacity-40' : ''}`}
          >
            <span
              className={`mt-0.5 flex-shrink-0 text-lg font-bold ${
                feature.disabled ? 'text-gray-400' : 'text-emerald-500'
              }`}
            >
              {feature.disabled ? '✕' : '✓'}
            </span>
            <span className={feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-600'}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const [isYearly, setIsYearly] = useState(false);

  if (!loaderData || loaderData.length === 0) {
    return (
      <div className='mx-auto max-w-2xl'>
        <NotFoundCard message='Pricing plans not found' />
      </div>
    );
  }

  // Filter out temp tier and sort by price
  const visibleTiers = loaderData
    .filter((tier) => tier.tier !== 'temp')
    .sort((a, b) => a.price_monthly_usd - b.price_monthly_usd);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 px-4 py-20'>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='animate-fade-in-up mb-16 text-center'>
          <h1 className='mb-6 text-5xl font-black tracking-tight text-gray-900 sm:text-6xl lg:text-7xl'>
            Choose Your Perfect Plan
          </h1>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Scale your course platform with flexible pricing designed for every stage of growth
          </p>

          {/* Billing Toggle */}
          <div className='mt-10 flex items-center justify-center gap-4'>
            <span
              className={`text-lg font-semibold ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative h-8 w-16 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-violet-600' : 'bg-gray-300'
              }`}
              aria-label='Toggle billing period'
            >
              <span
                className={`absolute top-1 h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isYearly ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-lg font-semibold ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Yearly
            </span>
            {isYearly && (
              <span className='rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold tracking-wide text-white uppercase shadow-lg'>
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div
          className='grid gap-8 lg:grid-cols-3'
          style={{
            gridTemplateColumns:
              visibleTiers.length === 3 ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(320px, 1fr))',
          }}
        >
          {visibleTiers.map((tier, index) => (
            <div
              key={tier.tier}
              className='animate-fade-in-up'
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <PricingCard tier={tier} isYearly={isYearly} />
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className='animate-fade-in-up mt-20 text-center' style={{ animationDelay: '600ms' }}>
          <p className='text-lg text-gray-600'>
            Need a custom plan?{' '}
            <p className='font-semibold text-violet-600 underline decoration-2 underline-offset-4 hover:text-violet-700'>
              info@gonasi.com
            </p>
          </p>
        </div>
      </div>
    </div>
  );
}
