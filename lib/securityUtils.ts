/**
 * Input sanitization helpers for user-generated text content.
 *
 * Strip HTML tags, normalize whitespace, and remove control characters
 * before persistence. Use on any field that will later be rendered as
 * text in the UI or emails (goal titles, comments, heart messages, etc.).
 *
 * NOTE: These helpers are a defense-in-depth layer. React already escapes
 * string interpolation, so stored XSS requires someone to later render with
 * dangerouslySetInnerHTML — but we sanitize at the boundary so no caller
 * can make that mistake.
 */

const HTML_TAG = /<\/?[a-zA-Z][^>]*>/g;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeInput(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(HTML_TAG, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, (m) => (m.includes('\n') ? '\n' : ' '))
    .trim();
}

export function sanitizeInputPreserveNewlines(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(HTML_TAG, '')
    .replace(CONTROL_CHARS, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
