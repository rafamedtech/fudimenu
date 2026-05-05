import { getPrisma } from '../../src/lib/db/prisma';
import { UAParser } from 'ua-parser-js';

function anonymizeUserAgent(uaString: string | null) {
  if (!uaString) return null;
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  const browserName = result.browser.name === 'Mobile Safari' ? 'Safari' : result.browser.name;

  return JSON.stringify({
    browser: browserName ?? null,
    browserMajor: result.browser.major ?? null,
    os: result.os.name ?? null,
    deviceType: result.device.type ?? 'desktop',
  });
}

async function main() {
  const prisma = getPrisma();
  const batchSize = 100;
  let cursor: string | undefined;
  let updated = 0;

  while (true) {
    const views = await prisma.menuView.findMany({
      where: {
        userAgent: {
          not: null,
        },
      },
      select: {
        id: true,
        userAgent: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (views.length === 0) break;

    for (const view of views) {
      if (!view.userAgent || view.userAgent.trim().startsWith('{')) continue;

      await prisma.menuView.update({
        where: { id: view.id },
        data: { userAgent: anonymizeUserAgent(view.userAgent) },
      });
      updated += 1;
    }

    cursor = views.at(-1)?.id;
    if (views.length < batchSize) break;
  }

  console.log(`Anonymized ${updated} existing menu view user-agent values.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
