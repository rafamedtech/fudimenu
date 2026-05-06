import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 32;
const HASH_PREFIX = 'scrypt';

export async function hashDeleteToken(token: string) {
  const salt = randomBytes(16).toString('base64url');
  const key = (await scryptAsync(token, salt, KEY_LENGTH)) as Buffer;
  return [HASH_PREFIX, salt, key.toString('base64url')].join('$');
}

export async function verifyDeleteToken(token: string, codeHash: string) {
  const [prefix, salt, expectedHash] = codeHash.split('$');
  if (prefix !== HASH_PREFIX || !salt || !expectedHash) return false;

  const expected = Buffer.from(expectedHash, 'base64url');
  const actual = (await scryptAsync(token, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function normalizeDeleteToken(token: string | null) {
  const normalized = token?.trim() ?? '';
  return /^\d{6}$/.test(normalized) ? normalized : null;
}
