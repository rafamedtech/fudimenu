import 'server-only';

const CONTROL_CHARS = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;
const SCRIPT_OR_STYLE = /<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG = /<\/?[A-Za-z][^>\s]*(?:\s[^>]*)?>?/g;

export function sanitizePlainText(
  input: string | null | undefined,
  maxLength: number,
): string | null {
  if (!input) return null;

  const stripped = input
    .replace(SCRIPT_OR_STYLE, '')
    .replace(HTML_TAG, '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return null;
  return stripped.slice(0, maxLength);
}
