import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const compat = new FlatCompat({ baseDirectory: __dirname });
const fudimenu = require('./eslint-rules');

const config = [
  {
    ignores: [
      '.claude/**',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/generated/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: { fudimenu },
    rules: {
      'fudimenu/require-tenant-id-in-prisma-findmany': 'error',
    },
  },
];

export default config;
