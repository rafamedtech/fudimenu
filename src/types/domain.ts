export type Role = 'owner' | 'admin' | 'staff';
export type Plan = 'free' | 'pro' | 'business';
export type Locale = 'es' | 'en';

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  cuisineType: string | null;
  defaultLocale: Locale;
  currency: string;
  plan: Plan;
  createdAt: string;
};

export type Category = {
  id: string;
  tenantId: string;
  name: string;
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
