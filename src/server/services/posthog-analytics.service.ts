import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import { getPrisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

type PostHogQueryResponse = {
  results?: unknown[][];
  error?: string;
  detail?: string;
};

export type TenantAnalyticsStats = {
  status: 'ready' | 'missing_config' | 'error';
  todayViews: number;
  previousDayViews: number;
  todayDeltaPercent: number | null;
  weeklyViews: number;
  previousWeeklyViews: number;
  weeklyDeltaPercent: number | null;
  topItems: Array<{
    id: string;
    name: string;
    views: number;
  }>;
};

const EMPTY_STATS: TenantAnalyticsStats = {
  status: 'ready',
  todayViews: 0,
  previousDayViews: 0,
  todayDeltaPercent: null,
  weeklyViews: 0,
  previousWeeklyViews: 0,
  weeklyDeltaPercent: null,
  topItems: [],
};

function getPostHogAppHost() {
  if (env.POSTHOG_API_HOST) return env.POSTHOG_API_HOST.replace(/\/$/, '');

  const ingestHost = env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  return ingestHost
    .replace('://us.i.posthog.com', '://us.posthog.com')
    .replace('://eu.i.posthog.com', '://eu.posthog.com')
    .replace(/\/$/, '');
}

function quoteHogQL(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function queryPostHog(query: string, name: string) {
  if (!env.POSTHOG_PERSONAL_API_KEY || !env.POSTHOG_PROJECT_ID) return null;

  const response = await fetch(`${getPostHogAppHost()}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      query: {
        kind: 'HogQLQuery',
        query,
      },
    }),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => ({}))) as PostHogQueryResponse;
  if (!response.ok || body.error || body.detail) {
    throw new Error(body.error ?? body.detail ?? `PostHog query failed with ${response.status}`);
  }

  return body.results ?? [];
}

export async function getTenantAnalyticsStats(tenantId: string): Promise<TenantAnalyticsStats> {
  noStore();

  if (!env.POSTHOG_PERSONAL_API_KEY || !env.POSTHOG_PROJECT_ID) {
    return { ...EMPTY_STATS, status: 'missing_config' };
  }

  try {
    const tenantIdLiteral = quoteHogQL(tenantId);
    const itemRows = await getPrisma().menuItem.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const itemsById = new Map(itemRows.map((item) => [item.id, item.name]));
    const itemIds = itemRows.map((item) => quoteHogQL(item.id)).join(', ');

    const viewsQuery = `
      SELECT
        countIf(timestamp >= today()) AS today_views,
        countIf(timestamp >= today() - INTERVAL 1 DAY AND timestamp < today()) AS previous_day_views,
        countIf(timestamp >= now() - INTERVAL 7 DAY) AS weekly_views,
        countIf(timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) AS previous_weekly_views
      FROM events
      WHERE event = 'menu_viewed'
        AND properties.tenantId = ${tenantIdLiteral}
        AND timestamp >= now() - INTERVAL 14 DAY
    `;

    const topItemsQuery = itemIds
      ? `
        SELECT properties.itemId AS item_id, count() AS views
        FROM events
        WHERE event = 'item_viewed'
          AND properties.itemId IN (${itemIds})
          AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY item_id
        ORDER BY views DESC
        LIMIT 5
      `
      : null;

    const [viewsResults, topItemResults] = await Promise.all([
      queryPostHog(viewsQuery, 'fudimenu stats weekly menu views'),
      topItemsQuery ? queryPostHog(topItemsQuery, 'fudimenu stats top items') : Promise.resolve([]),
    ]);

    const viewsRow = viewsResults?.[0] ?? [];
    const todayViews = toNumber(viewsRow[0]);
    const previousDayViews = toNumber(viewsRow[1]);
    const weeklyViews = toNumber(viewsRow[2]);
    const previousWeeklyViews = toNumber(viewsRow[3]);
    const todayDeltaPercent =
      previousDayViews > 0
        ? Math.round(((todayViews - previousDayViews) / previousDayViews) * 100)
        : todayViews > 0
          ? 100
          : null;
    const weeklyDeltaPercent =
      previousWeeklyViews > 0
        ? Math.round(((weeklyViews - previousWeeklyViews) / previousWeeklyViews) * 100)
        : weeklyViews > 0
          ? 100
          : null;

    return {
      status: 'ready',
      todayViews,
      previousDayViews,
      todayDeltaPercent,
      weeklyViews,
      previousWeeklyViews,
      weeklyDeltaPercent,
      topItems: (topItemResults ?? [])
        .map((row) => {
          const itemId = typeof row[0] === 'string' ? row[0] : '';
          return {
            id: itemId,
            name: itemsById.get(itemId) ?? 'Platillo sin nombre',
            views: toNumber(row[1]),
          };
        })
        .filter((row) => row.id && row.views > 0),
    };
  } catch (error) {
    console.error('Failed to load PostHog analytics stats', error);
    return { ...EMPTY_STATS, status: 'error' };
  }
}
