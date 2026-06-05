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
  whatsappClicks: number;
  previousWhatsappClicks: number;
  whatsappDeltaPercent: number | null;
  // clicks / menu views over the last 7 days, as a percentage.
  whatsappConversionPercent: number | null;
  topSearches: Array<{ query: string; count: number }>;
  noResultSearches: Array<{ query: string; count: number }>;
  trafficSources: Array<{ source: string; views: number }>;
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
  whatsappClicks: 0,
  previousWhatsappClicks: 0,
  whatsappDeltaPercent: null,
  whatsappConversionPercent: null,
  topSearches: [],
  noResultSearches: [],
  trafficSources: [],
};

export function deltaPercent(current: number, previous: number): number | null {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : null;
}

// Maps `[label, count]` HogQL rows into typed, non-empty entries.
export function mapLabeledCounts(rows: unknown[][] | null): Array<{ label: string; count: number }> {
  return (rows ?? [])
    .map((row) => ({
      label: typeof row[0] === 'string' ? row[0].trim() : '',
      count: toNumber(row[1]),
    }))
    .filter((row) => row.label && row.count > 0);
}

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

    // WhatsApp clicks are tagged with itemId only, so scope them to this tenant's
    // items (same pattern as item_viewed) instead of relying on a tenantId prop.
    const whatsappQuery = itemIds
      ? `
        SELECT
          countIf(timestamp >= now() - INTERVAL 7 DAY) AS week_clicks,
          countIf(timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) AS previous_clicks
        FROM events
        WHERE event = 'whatsapp_clicked'
          AND properties.itemId IN (${itemIds})
          AND timestamp >= now() - INTERVAL 14 DAY
      `
      : null;

    const topSearchesQuery = `
      SELECT properties.query AS q, count() AS c
      FROM events
      WHERE event = 'menu_search'
        AND properties.tenantId = ${tenantIdLiteral}
        AND timestamp >= now() - INTERVAL 7 DAY
      GROUP BY q
      ORDER BY c DESC
      LIMIT 5
    `;

    const noResultSearchesQuery = `
      SELECT properties.query AS q, count() AS c
      FROM events
      WHERE event = 'menu_search'
        AND properties.tenantId = ${tenantIdLiteral}
        AND toInt(properties.resultCount) = 0
        AND timestamp >= now() - INTERVAL 7 DAY
      GROUP BY q
      ORDER BY c DESC
      LIMIT 5
    `;

    const trafficSourcesQuery = `
      SELECT coalesce(nullIf(properties.source, ''), 'direct') AS src, count() AS c
      FROM events
      WHERE event = 'menu_viewed'
        AND properties.tenantId = ${tenantIdLiteral}
        AND timestamp >= now() - INTERVAL 7 DAY
      GROUP BY src
      ORDER BY c DESC
      LIMIT 6
    `;

    const [
      viewsResults,
      topItemResults,
      whatsappResults,
      topSearchResults,
      noResultSearchResults,
      trafficSourceResults,
    ] = await Promise.all([
      queryPostHog(viewsQuery, 'fudimenu stats weekly menu views'),
      topItemsQuery ? queryPostHog(topItemsQuery, 'fudimenu stats top items') : Promise.resolve([]),
      whatsappQuery ? queryPostHog(whatsappQuery, 'fudimenu stats whatsapp clicks') : Promise.resolve([]),
      queryPostHog(topSearchesQuery, 'fudimenu stats top searches'),
      queryPostHog(noResultSearchesQuery, 'fudimenu stats no-result searches'),
      queryPostHog(trafficSourcesQuery, 'fudimenu stats traffic sources'),
    ]);

    const viewsRow = viewsResults?.[0] ?? [];
    const todayViews = toNumber(viewsRow[0]);
    const previousDayViews = toNumber(viewsRow[1]);
    const weeklyViews = toNumber(viewsRow[2]);
    const previousWeeklyViews = toNumber(viewsRow[3]);
    const todayDeltaPercent = deltaPercent(todayViews, previousDayViews);
    const weeklyDeltaPercent = deltaPercent(weeklyViews, previousWeeklyViews);

    const whatsappRow = whatsappResults?.[0] ?? [];
    const whatsappClicks = toNumber(whatsappRow[0]);
    const previousWhatsappClicks = toNumber(whatsappRow[1]);

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
      whatsappClicks,
      previousWhatsappClicks,
      whatsappDeltaPercent: deltaPercent(whatsappClicks, previousWhatsappClicks),
      whatsappConversionPercent:
        weeklyViews > 0 ? Math.round((whatsappClicks / weeklyViews) * 100) : null,
      topSearches: mapLabeledCounts(topSearchResults).map(({ label, count }) => ({
        query: label,
        count,
      })),
      noResultSearches: mapLabeledCounts(noResultSearchResults).map(({ label, count }) => ({
        query: label,
        count,
      })),
      trafficSources: mapLabeledCounts(trafficSourceResults).map(({ label, count }) => ({
        source: label,
        views: count,
      })),
    };
  } catch (error) {
    console.error('Failed to load PostHog analytics stats', error);
    return { ...EMPTY_STATS, status: 'error' };
  }
}
