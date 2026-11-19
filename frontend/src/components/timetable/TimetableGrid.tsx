import { useMemo } from 'react';
import type { TimeSlot, TimetableEntry } from '../../types';
import { DAYS, dayIndex, formatTime } from '../../utils/format';

const PALETTE = [
  { bg: '#EAF0F7', bar: '#426A9B' },
  { bg: '#E6F4EE', bar: '#16845B' },
  { bg: '#FBF3E2', bar: '#B7791F' },
  { bg: '#F1ECF6', bar: '#7A5C9E' },
  { bg: '#E8F3F4', bar: '#2F7F86' },
  { bg: '#F7ECEC', bar: '#A85454' },
];

export function colorFor(entry: TimetableEntry) {
  const key = entry.department_id ?? entry.course_id ?? 0;
  return PALETTE[Math.abs(Number(key)) % PALETTE.length];
}

const hhmm = (t?: string) => (t ?? '').slice(0, 5);

interface Props {
  entries: TimetableEntry[];
  slots?: TimeSlot[];
  days?: string[];
  onEntryClick?: (e: TimetableEntry) => void;
  /** Which secondary line to show in each block. */
  showTeacher?: boolean;
  showRoom?: boolean;
}

export function TimetableGrid({ entries, slots = [], days, onEntryClick, showTeacher = true, showRoom = true }: Props) {
  const { columns, rows } = useMemo(() => {
    const cols = days && days.length ? days : DAYS.filter((d, i) => i < 6 || entries.some((e) => dayIndex(e.day_of_week) === i));
    const map = new Map<string, { start: string; end: string }>();
    const add = (s?: string, e?: string) => {
      if (s && e) map.set(`${hhmm(s)}-${hhmm(e)}`, { start: s, end: e });
    };
    slots.forEach((s) => add(s.start_time, s.end_time));
    entries.forEach((e) => add(e.start_time, e.end_time));
    const r = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => ({ key, ...v }));
    return { columns: [...cols], rows: r };
  }, [entries, slots, days]);

  const cell = (day: string, rowKey: string) =>
    entries.filter(
      (e) => dayIndex(e.day_of_week) === dayIndex(day) && `${hhmm(e.start_time)}-${hhmm(e.end_time)}` === rowKey,
    );

  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No timetable entries to display.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] table-fixed border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-line bg-app/70">
            <th className="th w-[96px] border-r border-line">Time</th>
            {columns.map((d) => (
              <th key={d} className="th border-r border-line last:border-r-0">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-b-0">
              <td className="border-r border-line bg-app/40 px-2 py-2 align-top text-[11px] leading-tight text-ink-muted">
                <div className="font-medium text-ink">{formatTime(r.start)}</div>
                <div>{formatTime(r.end)}</div>
              </td>
              {columns.map((d) => (
                <td key={d} className="border-r border-line p-1 align-top last:border-r-0">
                  <div className="space-y-1">
                    {cell(d, r.key).map((e) => {
                      const c = colorFor(e);
                      return (
                        <button
                          key={e.timetable_id}
                          type="button"
                          onClick={() => onEntryClick?.(e)}
                          className="block w-full rounded-sm border-l-[3px] px-1.5 py-1 text-left leading-tight hover:brightness-95 disabled:cursor-default"
                          style={{ backgroundColor: c.bg, borderLeftColor: c.bar }}
                          disabled={!onEntryClick}
                          title={`${e.course_name ?? ''} – ${e.teacher_name ?? ''}`}
                        >
                          <div className="truncate font-semibold text-ink">{e.course_code ?? e.course_name}</div>
                          <div className="truncate text-ink-muted">{e.course_code ? e.course_name : ''}</div>
                          {showTeacher && e.teacher_name && <div className="truncate text-ink-muted">{e.teacher_name}</div>}
                          {showRoom && e.room_number && (
                            <div className="truncate text-ink-muted">
                              {e.room_number}
                              {e.section ? ` · ${e.section}` : ''}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
