import { billingService } from '@/server/services/billing.service';

function authenticateCron(request: Request) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!authenticateCron(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (new URL(request.url).searchParams.get('dryRun') === '1') {
    return Response.json({
      ok: true,
      dryRun: true,
      wouldRun: ['sendTrialReminderEmails', 'downgradeExpiredTrialsWithoutCard'],
    });
  }

  const [reminders, downgrades] = await Promise.all([
    billingService.sendTrialReminderEmails(12),
    billingService.downgradeExpiredTrialsWithoutCard(),
  ]);

  return Response.json({
    ok: true,
    reminders,
    downgrades,
  });
}
