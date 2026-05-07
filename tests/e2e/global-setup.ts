import { execSync } from 'node:child_process';

export default async function globalSetup() {
  execSync('pnpm db:push --force-reset', { stdio: 'inherit' });
  execSync('pnpm db:seed', { stdio: 'inherit' });
}
