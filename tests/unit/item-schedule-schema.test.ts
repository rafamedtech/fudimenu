import { describe, expect, it } from 'vitest';
import { categorySchema, itemSchema, tenantUpdateSchema } from '../../src/lib/validators/item.schema';
import { sectionSchema } from '../../src/lib/validators/section.schema';

const base = { name: 'Café', categoryId: null, priceCents: 5000 };

describe('itemSchema visibility scheduling', () => {
  it('dedupes and sorts schedule days into a canonical set', () => {
    const result = itemSchema.parse({ ...base, scheduleDays: [5, 1, 5, 0, 3] });
    expect(result.scheduleDays).toEqual([0, 1, 3, 5]);
  });

  it('rejects an end time at or before the start time', () => {
    expect(
      itemSchema.safeParse({ ...base, scheduleStartMinute: 660, scheduleEndMinute: 420 }).success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({ ...base, scheduleStartMinute: 420, scheduleEndMinute: 420 }).success,
    ).toBe(false);
  });

  it('accepts a valid window and independent open bounds', () => {
    expect(
      itemSchema.safeParse({ ...base, scheduleStartMinute: 420, scheduleEndMinute: 660 }).success,
    ).toBe(true);
    // Open start (from midnight) and open end (until close) are each allowed alone.
    expect(itemSchema.safeParse({ ...base, scheduleEndMinute: 660 }).success).toBe(true);
    expect(itemSchema.safeParse({ ...base, scheduleStartMinute: 420 }).success).toBe(true);
  });

  it('rejects out-of-range days and minutes', () => {
    expect(itemSchema.safeParse({ ...base, scheduleDays: [7] }).success).toBe(false);
    expect(itemSchema.safeParse({ ...base, scheduleStartMinute: 1440 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...base, scheduleEndMinute: 1441 }).success).toBe(false);
  });

  it('validates the optional date range', () => {
    expect(
      itemSchema.safeParse({ ...base, scheduleStartDate: '2024-12-01', scheduleEndDate: '2024-12-31' })
        .success,
    ).toBe(true);
    // end before start → rejected.
    expect(
      itemSchema.safeParse({ ...base, scheduleStartDate: '2024-12-31', scheduleEndDate: '2024-12-01' })
        .success,
    ).toBe(false);
    // equal dates (single day) → allowed.
    expect(
      itemSchema.safeParse({ ...base, scheduleStartDate: '2024-12-25', scheduleEndDate: '2024-12-25' })
        .success,
    ).toBe(true);
    // malformed date → rejected.
    expect(itemSchema.safeParse({ ...base, scheduleStartDate: '12/01/2024' }).success).toBe(false);
  });
});

describe('category + section schemas share the schedule rules', () => {
  it('accept a schedule and reject an inverted time window', () => {
    expect(
      categorySchema.safeParse({ name: 'Desayunos', scheduleDays: [1], scheduleStartMinute: 420, scheduleEndMinute: 660 })
        .success,
    ).toBe(true);
    expect(
      sectionSchema.safeParse({ name: 'Mañana', scheduleStartMinute: 660, scheduleEndMinute: 420 }).success,
    ).toBe(false);
  });
});

describe('tenantUpdateSchema timezone', () => {
  it('accepts a valid IANA zone, null, and rejects garbage', () => {
    expect(tenantUpdateSchema.safeParse({ timezone: 'America/Tijuana' }).success).toBe(true);
    expect(tenantUpdateSchema.safeParse({ timezone: null }).success).toBe(true);
    expect(tenantUpdateSchema.safeParse({ timezone: 'Mars/Phobos' }).success).toBe(false);
  });
});
