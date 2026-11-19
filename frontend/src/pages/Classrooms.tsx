import { useState } from 'react';
import { z } from 'zod';
import { CalendarDays } from 'lucide-react';
import { CrudPage, type CrudFilter, type FieldDef } from '../components/common/CrudPage';
import type { Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { AsyncBoundary } from '../components/common/States';
import { TimetableGrid } from '../components/timetable/TimetableGrid';
import { classroomsApi } from '../api/classrooms.api';
import { timetableApi } from '../api/timetable.api';
import { useFetch } from '../hooks/useFetch';
import type { Classroom } from '../types';

const schema = z.object({
  room_number: z.string().trim().min(1, 'Enter the room number'),
  building: z.string().trim().min(1, 'Enter the building'),
  capacity: z.coerce.number({ invalid_type_error: 'Enter capacity' }).int().min(1, 'Minimum 1').max(1000, 'Maximum 1000'),
  room_type: z.string().min(1, 'Select a room type'),
});

const ROOM_TYPES = ['Lecture Hall', 'Laboratory', 'Seminar Room', 'Tutorial Room'];

const fields: FieldDef[] = [
  { name: 'room_number', label: 'Room number', type: 'text', placeholder: 'e.g. A-204' },
  { name: 'building', label: 'Building', type: 'text', placeholder: 'e.g. Main Block' },
  { name: 'capacity', label: 'Capacity', type: 'number' },
  { name: 'room_type', label: 'Room type', type: 'select', options: ROOM_TYPES.map((t) => ({ value: t, label: t })) },
];

const columns: Column<Classroom>[] = [
  { key: 'classroom_id', header: 'ID', sortValue: (r) => r.classroom_id, className: 'w-16' },
  { key: 'room_number', header: 'Room', sortValue: (r) => r.room_number, render: (r) => <span className="font-medium">{r.room_number}</span> },
  { key: 'building', header: 'Building', sortValue: (r) => r.building },
  { key: 'capacity', header: 'Capacity', sortValue: (r) => r.capacity },
  { key: 'room_type', header: 'Room type', sortValue: (r) => r.room_type },
];

function ClassroomTimetable({ room, onClose }: { room: Classroom | null; onClose: () => void }) {
  const { data, loading, error, reload } = useFetch(
    (s) => timetableApi.list({ classroom_id: room!.classroom_id }, s),
    [room?.classroom_id],
    room !== null,
  );
  return (
    <Modal open={room !== null} title={room ? `Timetable – Room ${room.room_number}, ${room.building}` : ''} size="xl" onClose={onClose}>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        <div className="rounded border border-line">
          <TimetableGrid entries={data ?? []} showRoom={false} />
        </div>
      </AsyncBoundary>
    </Modal>
  );
}

export default function Classrooms() {
  const [timetableFor, setTimetableFor] = useState<Classroom | null>(null);
  // Filter options are derived from the classroom list once it loads.
  const all = useFetch((s) => classroomsApi.list(undefined, s), []);
  const uniq = (key: 'building' | 'room_type') =>
    [...new Set((all.data ?? []).map((r) => r[key]).filter(Boolean))].sort().map((v) => ({ value: v, label: v }));

  const filters: CrudFilter<Classroom>[] = [
    { key: 'building', label: 'Building', options: uniq('building'), predicate: (r, v) => r.building === v },
    { key: 'type', label: 'Room type', options: uniq('room_type'), predicate: (r, v) => r.room_type === v },
  ];

  return (
    <>
      <CrudPage<Classroom>
        title="Classrooms"
        description="Rooms available for scheduling, with capacity and type."
        singular="Classroom"
        api={classroomsApi}
        getId={(r) => r.classroom_id}
        columns={columns}
        fields={fields}
        schema={schema}
        defaultValues={{ room_number: '', building: '', capacity: 60, room_type: '' }}
        searchText={(r) => `${r.room_number} ${r.building} ${r.room_type}`}
        searchPlaceholder="Search room or building…"
        filters={filters}
        describeRow={(r) => `Room ${r.room_number} (${r.building})`}
        rowActions={(r) => (
          <button className="icon-btn" title="Room timetable" aria-label="View classroom timetable" onClick={() => setTimetableFor(r)}>
            <CalendarDays size={14} />
          </button>
        )}
      />
      <ClassroomTimetable room={timetableFor} onClose={() => setTimetableFor(null)} />
    </>
  );
}
