import { describe, expect, it } from 'vitest';
import { PLAN_CONFIG, PLANS } from '@/config/plans';

describe('billing plan config', () => {
  it('exposes only Free and Pro as MVP billing plans', () => {
    expect(PLANS.map((plan) => plan.id)).toEqual(['free', 'pro']);
  });

  it('keeps out-of-MVP capabilities disabled in plan feature flags', () => {
    expect(Object.values(PLAN_CONFIG).every((plan) => plan.features.modifiers === false)).toBe(
      true,
    );
  });

  it('does not define branch limits while multi-branch is out of MVP scope', () => {
    expect(Object.values(PLAN_CONFIG).every((plan) => !('branches' in plan.limits))).toBe(true);
  });
});
