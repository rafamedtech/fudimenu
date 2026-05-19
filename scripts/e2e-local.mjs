import { spawnSync } from 'node:child_process';

const composeFile = 'docker-compose.e2e.yml';
const service = 'postgres';
const databaseUrl =
  'postgresql://fudimenu_test:fudimenu_test@127.0.0.1:55432/fudimenu_test?schema=public';
const playwrightArgs = process.argv.slice(2);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function waitForPostgres() {
  const startedAt = Date.now();
  const timeoutMs = 60_000;

  while (Date.now() - startedAt < timeoutMs) {
    const result = spawnSync(
      'docker',
      ['compose', '-f', composeFile, 'exec', '-T', service, 'pg_isready', '-U', 'fudimenu_test', '-d', 'fudimenu_test'],
      { stdio: 'ignore' },
    );

    if (result.status === 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1_000);
  }

  console.error('Timed out waiting for local E2E Postgres.');
  process.exit(1);
}

const dockerInfo = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (dockerInfo.status !== 0) {
  console.error('Docker daemon is not running. Start Docker Desktop, then rerun pnpm test:e2e:local.');
  process.exit(1);
}

run('docker', ['compose', '-f', composeFile, 'up', '-d']);
waitForPostgres();

run('pnpm', ['test:e2e', ...playwrightArgs], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-role-key',
    USE_MOCKS: 'false',
  },
});
