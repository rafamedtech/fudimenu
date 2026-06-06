/**
 * Lightweight per-tenant image library derived from images already in use
 * (logo, covers, item photos). Not a DAM — just a deduped list so admins can
 * reuse an existing image instead of re-uploading. Order-preserving so the
 * caller controls priority (e.g. brand assets first).
 */
export function dedupeImageUrls(urls: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }

  return result;
}
