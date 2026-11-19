export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function dayIndex(day?: string): number {
  if (!day) return 99;
  const i = DAYS.findIndex((d) => d.toLowerCase().startsWith(day.slice(0, 3).toLowerCase()));
  return i === -1 ? 99 : i;
}

export function shortDay(day?: string): string {
  return day ? day.slice(0, 3) : '';
}

/** "09:00:00" -> "9:00 AM" */
export function formatTime(t?: string): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return t;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${(m ?? '00').slice(0, 2)} ${suffix}`;
}

export function formatRange(start?: string, end?: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** yyyy-mm-dd in local time (for <input type="date">). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayDayName(): string {
  return DAYS[(new Date().getDay() + 6) % 7];
}

/** Turns an array or comma separated string into a string list. */
export function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n');
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
