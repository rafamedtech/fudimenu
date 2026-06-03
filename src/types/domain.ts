export type Role = 'owner' | 'admin' | 'staff';
export type Plan = 'free' | 'pro' | 'business';
export type Locale = 'es' | 'en';
export type LogoShape = 'rectangular' | 'square' | 'round';

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  logoShape: LogoShape;
  whatsappPhone: string | null;
  businessHours: string | null;
  primaryColor: string;
  cuisineType: string | null;
  defaultLocale: Locale;
  currency: string;
  plan: Plan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: string;
};

export type MenuSection = {
  id: string;
  tenantId: string;
  name: string;
  coverImageUrl: string | null;
  accentColor: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type Category = {
  id: string;
  tenantId: string;
  sectionId: string | null;
  name: string;
  coverImageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export type MenuItem = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  priceCents: number;
  isSpecialToday?: boolean;
  specialPrice?: number | null;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ItemTranslation = {
  itemId: string;
  locale: Locale;
  name: string | null;
  description: string | null;
};

export type Membership = {
  tenantId: string;
  userId: string;
  role: Role;
};
