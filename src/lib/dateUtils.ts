export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function isToday(key: string): boolean {
  return key === localDateKey();
}

export function isYesterday(key: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return key === localDateKey(d);
}

export function addDaysKey(key: string, days: number): string {
  const d = parseLocalDate(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export function dateKeyFromIso(iso: string): string {
  return localDateKey(new Date(iso));
}
