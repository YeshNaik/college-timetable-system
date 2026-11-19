import { z } from 'zod';
import { Pencil, Trash2 } from 'lucide-react';
import { CrudPage, type CrudFilter, type FieldDef, type RowHandlers } from '../components/common/CrudPage';
import type { Column } from '../components/common/DataTable';
import { timeSlotsApi } from '../api/timeSlots.api';
import { DAYS, dayIndex, formatTime } from '../utils/format';
import type { TimeSlot } from '../types';

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Enter a valid time');

const schema = z
  .object({
    day_of_week: z.string().min(1, 'Select a day'),
    start_time: time,
    end_time: time,
  })
  .refine((v) => v.end_time.slice(0, 5) > v.start_time.slice(0, 5), { path: ['end_time'], message: 'End time must be after start time' });

const fields: FieldDef[] = [
  { name: 'day_of_week', label: 'Day of week', type: 'select', options: DAYS.map((d) => ({ value: d, label: d })) },
  { name: 'start_time', label: 'Start time', type: 'time' },
  { name: 'end_time', label: 'End time', type: 'time' },
];

const columns: Column<TimeSlot>[] = [
  { key: 'slot_id', header: 'ID', sortValue: (r) => r.slot_id, className: 'w-16' },
  { key: 'day_of_week', header: 'Day', sortValue: (r) => dayIndex(r.day_of_week) },
  { key: 'start_time', header: 'Start', sortValue: (r) => r.start_time, render: (r) => formatTime(r.start_time) },
  { key: 'end_time', header: 'End', sortValue: (r) => r.end_time, render: (r) => formatTime(r.end_time) },
];

const filters: CrudFilter<TimeSlot>[] = [
  { key: 'day', label: 'Day', options: DAYS.map((d) => ({ value: d, label: d })), predicate: (r, v) => dayIndex(r.day_of_week) === dayIndex(v) },
];

function GroupedByDay({ rows, h }: { rows: TimeSlot[]; h: RowHandlers<TimeSlot> }) {
  const groups = DAYS.map((d) => ({
    day: d,
    slots: rows.filter((r) => dayIndex(r.day_of_week) === dayIndex(d)).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((g) => g.slots.length > 0);

  if (groups.length === 0) return <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No time slots found.</p>;
  return (
    <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((g) => (
        <section key={g.day} className="bg-white p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{g.day}</h3>
          <ul className="space-y-1">
            {g.slots.map((s) => (
              <li key={s.slot_id} className="flex items-center justify-between rounded border border-line px-2.5 py-1.5 text-[13px]">
                <span>
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                </span>
                <span className="flex">
                  <button className="icon-btn" aria-label="Edit time slot" onClick={() => h.edit(s)}>
                    <Pencil size={13} />
                  </button>
                  <button className="icon-btn hover:!text-danger" aria-label="Delete time slot" onClick={() => h.remove(s)}>
                    <Trash2 size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function TimeSlots() {
  return (
    <CrudPage<TimeSlot>
      title="Time Slots"
      description="Teaching periods available for the weekly timetable."
      singular="Time slot"
      api={timeSlotsApi}
      getId={(r) => r.slot_id}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ day_of_week: '', start_time: '', end_time: '' }}
      searchText={(r) => `${r.day_of_week} ${formatTime(r.start_time)} ${formatTime(r.end_time)}`}
      searchPlaceholder="Search day or time…"
      filters={filters}
      describeRow={(r) => `${r.day_of_week} ${formatTime(r.start_time)} – ${formatTime(r.end_time)}`}
      alternateView={{ label: 'Grouped by day', render: (rows, h) => <GroupedByDay rows={rows} h={h} /> }}
    />
  );
}
