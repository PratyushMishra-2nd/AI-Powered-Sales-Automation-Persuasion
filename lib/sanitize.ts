export function sanitize(s: unknown, maxLen = 500): string {
  return String(s ?? '').trim().slice(0, maxLen)
}
