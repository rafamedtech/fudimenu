import type { Plan } from '@/types/domain';

type AnalyticsAccess = 'none' | 'basic';

export type PlanLimits = {
  sections: number | null;
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
      sections: 5,
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
      sections: null,
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
      sections: null,
      items: null,
    },
    features: {
      fudiMenuBranding: false,
      analytics: 'basic',
      specials: true,
      multiLanguage: true,
      modifiers: false,
    },
  },
};

export const PLANS = [PLAN_CONFIG.free, PLAN_CONFIG.pro, PLAN_CONFIG.business] as const;

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIG[plan];
}

type MembershipForLimit = {
  role: 'owner' | 'admin' | 'staff';
  tenant: { plan: Plan };
};

export function canCreateAnotherMenu(memberships: MembershipForLimit[]): boolean {
  if (memberships.length === 0) return true;
  return memberships.some(
    (m) => m.tenant.plan === 'business' && (m.role === 'owner' || m.role === 'admin'),
  );
}
