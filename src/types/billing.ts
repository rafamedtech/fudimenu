export type LivePrice = {
  unitAmount: number;
  currency: string;
};

export type LivePriceCycle = 'monthly' | 'annual';

export type LivePrices = {
  pro: Partial<Record<LivePriceCycle, LivePrice>>;
  business: Partial<Record<LivePriceCycle, LivePrice>>;
};
