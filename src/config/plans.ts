import type { Plan } from '@/types/domain';

type AnalyticsAccess = 'none' | 'basic';

export type PlanLimits = {
  branches: number | null;
  items: number | null;
};

export type PlanFeatures = {
  fudiMenuBranding: boolean;
  analytics: AnalyticsAccess;
  specials: boolean;
  multiLanguage: boolean;
  modifiers: boolean;
};

export type PlanConfig = {
  id: Plan;
  name: string;
  priceCents: number;
  currency: 'MXN';
  interval: 'month';
  limits: PlanLimits;
  features: PlanFeatures;
};

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceCents: 0,
    currency: 'MXN',
    interval: 'month',
    limits: {
      branches: 1,
      items: 20,
    },
    features: {
      fudiMenuBranding: true,
      analytics: 'none',
      specials: false,
      multiLanguage: false,
      modifiers: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceCents: 14_900,
    currency: 'MXN',
    interval: 'month',
    limits: {
      branches: null,
      items: null,
    },
    features: {
      fudiMenuBranding: false,
      analytics: 'basic',
      specials: true,
      multiLanguage: false,
      modifiers: false,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    priceCents: 39_900,
    currency: 'MXN',
    interval: 'month',
    limits: {
      branches: 3,
      items: null,
    },
    features: {
      fudiMenuBranding: false,
      analytics: 'basic',
      specials: true,
      multiLanguage: true,
      modifiers: true,
    },
  },
};

export const PLANS = [PLAN_CONFIG.free, PLAN_CONFIG.pro, PLAN_CONFIG.business] as const;

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIG[plan];
}
