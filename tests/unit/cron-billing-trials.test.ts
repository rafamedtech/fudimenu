import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendTrialReminderEmails: vi.fn(),
  downgradeExpiredTrialsWithoutCard: vi.fn(),
}));

vi.mock('@/server/services/billing.service', () => ({
  billingService: {
    sendTrialReminderEmails: mocks.sendTrialReminderEmails,
    downgradeExpiredTrialsWithoutCard: mocks.downgradeExpiredTrialsWithoutCard,
  },
}));

const originalCronSecret = process.env.CRON_SECRET;

function cronRequest(path = '/api/cron/billing-trials', authorization = 'Bearer cron-secret') {
  return new Request(`https://app.fudimenu.test${path}`, {
    headers: authorization ? { authorization } : {},
  });
}

async function loadRoute() {
  const mod = await import('../../src/app/api/cron/billing-trials/route');
  return mod.GET;
}

describe('billing trials cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 without the correct Authorization header', async () => {
    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/billing-trials', 'Bearer wrong'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: 'Unauthorized' });
    expect(mocks.sendTrialReminderEmails).not.toHaveBeenCalled();
  });

  it('dryRun returns planned jobs without sending emails or downgrading tenants', async () => {
    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/billing-trials?dryRun=1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      dryRun: true,
      wouldRun: ['sendTrialReminderEmails', 'downgradeExpiredTrialsWithoutCard'],
    });
    expect(mocks.sendTrialReminderEmails).not.toHaveBeenCalled();
    expect(mocks.downgradeExpiredTrialsWithoutCard).not.toHaveBeenCalled();
  });
});
