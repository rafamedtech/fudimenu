export function isMockRuntime() {
  return (
    process.env.USE_MOCKS === 'true' &&
    process.env.VITEST !== 'true' &&
    !process.env.VITEST_WORKER_ID
  );
}
