const coverageExclude = [
  '**/*.d.ts',
  '**/*.config.*',
  '.nuxt/**',
  '.output/**',
  'coverage/**',
  'generated/**',
  'prisma/**',
  'tests/**'
]

const thresholds = {
  lines: 70,
  statements: 70,
  functions: 70,
  branches: 60
}

export const unitCoverage = {
  provider: 'v8' as const,
  reporter: ['text', 'html', 'lcov'],
  reportsDirectory: './coverage/unit',
  include: ['lib/**/*.ts', 'server/**/*.ts'],
  exclude: coverageExclude,
  thresholds
}

export const integrationCoverage = {
  provider: 'v8' as const,
  reporter: ['text', 'html', 'lcov'],
  reportsDirectory: './coverage/integration',
  include: ['app/**/*.ts', 'app/**/*.vue', 'server/**/*.ts', 'lib/**/*.ts'],
  exclude: coverageExclude,
  thresholds
}
