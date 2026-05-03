export function requireStr(v: unknown, maxLen = 2000): string {
  return typeof v === 'string' ? v.slice(0, maxLen) : ''
}

export function requireNum(v: unknown, min = 0, max = 10): number {
  const n = Number(v)
  return isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min
}

export function requireArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

export function requireOneOf<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}

export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
