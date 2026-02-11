'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying out TOVO',
    features: [
      'Unlimited one-on-one meetings',
      '40-minute group meetings',
      '100 participants per meeting',
      'Screen sharing',
      'Hand raising',
    ],
    cta: 'Get Started',
    href: '/sign-up',
    popular: false,
  },
  {
    name: 'Pro',
    price: { monthly: 15, yearly: 144 },
    description: 'For small teams and professionals',
    features: [
      'Everything in Free',
      'Unlimited group meetings',
      'Cloud recording (1GB)',
      'Live streaming to YouTube',
      'Admin controls',
      'User management',
    ],
    cta: 'Subscribe Now',
    href: '/checkout/pro',
    popular: true,
  },
  {
    name: 'Business',
    price: { monthly: 35, yearly: 336 },
    description: 'For scaling organizations',
    features: [
      'Everything in Pro',
      '300 participants',
      'Unlimited cloud recording',
      'SSO & Managed domains',
      'Company branding',
      '24/7 Phone support',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section className="flex flex-col items-center pt-32 pb-20 px-4 text-black dark:text-white">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-6">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the plan that's right for you. All plans include unlimited video calling.
        </p>

        <div className="flex items-center justify-center mt-8 gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-black dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span
              className={`${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-black dark:text-white' : 'text-gray-500'}`}>
            Yearly <span className="text-blue-1 font-bold">(Save 20%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-8 rounded-2xl border ${
              plan.popular
                ? 'border-blue-1 bg-white dark:bg-dark-1 shadow-2xl scale-105 z-10'
                : 'border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-2'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-1 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold">
                ${billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
              {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                <p className="text-sm text-gray-500 mt-2">Billed ${plan.price.yearly} yearly</p>
              )}
            </div>
            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-blue-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="w-full">
              <Button
                className={`w-full py-6 text-lg rounded-xl ${
                  plan.popular
                    ? 'bg-blue-1 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-dark-3 hover:bg-gray-200 dark:hover:bg-dark-4 text-black dark:text-white'
                }`}
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
