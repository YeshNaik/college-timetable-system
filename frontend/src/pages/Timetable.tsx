import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar, SelectFilter } from '../components/common/FilterBar';
import { AsyncBoundary, EmptyState } from '../components/common/States';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DetailList } from '../components/common/CrudPage';
import { useToast } from '../components/common/Toast';
import { TimetableGrid, colorFor } from '../components/timetable/TimetableGrid';
import { EntryFormModal } from '../components/timetable/EntryFormModal';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import { describeError } from '../api/client';
import { timetableApi } from '../api/timetable.api';
import { teachersApi } from '../api/teachers.api';
import { departmentsApi } from '../api/departments.api';
import { classroomsApi } from '../api/classrooms.api';
import { timeSlotsApi } from '../api/timeSlots.api';
import { DAYS, dayIndex, formatRange, todayDayName } from '../utils/format';
import type { TimetableEntry } from '../types';

type Scope = 'all' | 'teacher' | 'department' | 'classroom' | 'section';
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All classes' },
  { key: 'teacher', label: 'Teacher-wise' },
  { key: 'department', label: 'Department-wise' },
  { key: 'classroom', label: 'Classroom-wise' },
  { key: 'section', label: 'Section-wise' },
];

export default function Timetable() {
  const toast = useToast();
  const [view, setView] = useState<'week' | 'day'>('week');
  const [scope, setScope] = useState<Scope>('all');
  const [teacherId, setTeacherId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [day, setDay] = useState(todayDayName());

  const debounced = useDebounce({ section, semester, academicYear }, 400);

  const teachers = useFetch((s) => teachersApi.list(undefined, s), []);
  const departments = useFetch((s) => departmentsApi.list(undefined, s), []);
  const rooms = useFetch((s) => classroomsApi.list(undefined, s), []);
  const slots = useFetch((s) => timeSlotsApi.list(undefined, s), []);

  const needsSelection =
    (scope === 'teacher' && !teacherId) ||
    (scope === 'department' && !departmentId) ||
    (scope === 'classroom' && !classroomId) ||
    (scope === 'section' && !debounced.section);

  const params = {
    teacher_id: scope === 'teacher' ? teacherId : undefined,
    department_id: scope === 'department' ? departmentId : undefined,
    classroom_id: scope === 'classroom' ? classroomId : undefined,
    section: scope === 'section' ? debounced.section : undefined,
    semester: debounced.semester,
    academic_year: debounced.academicYear,
  };
  const { data, loading, error, reload } = useFetch(
    (s) => timetableApi.list(params, s),
    [scope, teacherId, departmentId, classroomId, debounced.section, debounced.semester, debounced.academicYear],
    !needsSelection,
  );

  const entries = data ?? [];
  const dayEntries = useMemo(
    () => entries.filter((e) => dayIndex(e.day_of_week) === dayIndex(day)).sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')),
    [entries, day],
  );

  const [formEntry, setFormEntry] = useState<TimetableEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<TimetableEntry | null>(null);
  const [deleting, setDeleting] = useState<TimetableEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setFormEntry(null);
    setFormOpen(true);
  };
  const openEdit = (e: TimetableEntry) => {
    setDetail(null);
    setFormEntry(e);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await timetableApi.remove(deleting.timetable_id);
      toast.success('Timetable entry deleted.');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(describeError(e).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const teacherOpts = (teachers.data ?? []).map((t) => ({ value: String(t.teacher_id), label: t.teacher_name }));
  const deptOpts = (departments.data ?? []).map((d) => ({ value: String(d.department_id), label: d.department_name }));
  const roomOpts = (rooms.data ?? []).map((r) => ({ value: String(r.classroom_id), label: `${r.room_number} · ${r.building}` }));

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly and daily class schedule. The server checks teacher, classroom and section conflicts on every save."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={14} /> Add entry
          </button>
        }
      />

      <div className="panel">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          <div className="flex rounded border border-line p-0.5 text-xs" role="tablist" aria-label="Scope">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={scope === s.key}
                onClick={() => setScope(s.key)}
                className={`rounded px-2.5 py-1 ${scope === s.key ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex rounded border border-line p-0.5 text-xs">
            {(['week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded px-2.5 py-1 ${view === v ? 'bg-secondary text-white' : 'text-ink-muted hover:text-ink'}`}
              >
                {v === 'week' ? 'Weekly' : 'Daily'}
              </button>
            ))}
          </div>
        </div>

        <FilterBar>
          {scope === 'teacher' && <SelectFilter label="Teacher" value={teacherId} onChange={setTeacherId} options={teacherOpts} allLabel="Select teacher…" className="w-56" />}
          {scope === 'department' && <SelectFilter label="Department" value={departmentId} onChange={setDepartmentId} options={deptOpts} allLabel="Select department…" className="w-56" />}
          {scope === 'classroom' && <SelectFilter label="Classroom" value={classroomId} onChange={setClassroomId} options={roomOpts} allLabel="Select classroom…" className="w-56" />}
          {scope === 'section' && (
            <div className="w-32">
              <label className="label">Section</label>
              <input className="input" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" aria-label="Section" />
            </div>
          )}
          <div className="w-28">
            <label className="label">Semester</label>
            <input className="input" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Any" aria-label="Semester" />
          </div>
          <div className="w-32">
            <label className="label">Academic year</label>
            <input className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" aria-label="Academic year" />
          </div>
          {view === 'day' && (
            <SelectFilter label="Day" value={day} onChange={(v) => setDay(v || todayDayName())} options={DAYS.map((d) => ({ value: d, label: d }))} allLabel={todayDayName() + ' (today)'} className="w-40" />
          )}
        </FilterBar>

        {needsSelection ? (
          <EmptyState title={`Choose a ${scope} to display its timetable`} hint="Pick a value in the filter above." />
        ) : (
          <AsyncBoundary loading={loading} error={error} onRetry={reload}>
            {view === 'week' ? (
              <TimetableGrid entries={entries} slots={slots.data ?? []} onEntryClick={setDetail} />
            ) : dayEntries.length === 0 ? (
              <EmptyState title={`No classes on ${day}`} />
            ) : (
              <ul className="divide-y divide-line">
                {dayEntries.map((e) => (
                  <li key={e.timetable_id}>
                    <button className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-app/60" onClick={() => setDetail(e)}>
                      <span className="h-9 w-1 rounded" style={{ backgroundColor: colorFor(e).bar }} />
                      <span className="w-40 shrink-0 text-[13px] font-medium">{formatRange(e.start_time, e.end_time)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {e.course_code} · {e.course_name}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {e.teacher_name} · Room {e.room_number} · Section {e.section}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        )}
      </div>

      <Modal
        open={detail !== null}
        title="Class details"
        onClose={() => setDetail(null)}
        footer={
          detail && (
            <>
              <button className="btn-secondary" onClick={() => openEdit(detail)}>
                <Pencil size={13} /> Edit
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  setDeleting(detail);
                  setDetail(null);
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )
        }
      >
        {detail && (
          <DetailList
            data={{
              Course: `${detail.course_code ?? ''} ${detail.course_name ?? ''}`.trim(),
              Teacher: detail.teacher_name,
              Classroom: [detail.room_number, detail.building].filter(Boolean).join(', '),
              Day: detail.day_of_week,
              Time: formatRange(detail.start_time, detail.end_time),
              Section: detail.section,
              Semester: detail.semester,
              'Academic year': detail.academic_year,
              Department: detail.department_name,
              'Timetable ID': detail.timetable_id,
            }}
          />
        )}
      </Modal>

      <EntryFormModal
        open={formOpen}
        entry={formEntry}
        defaults={{ semester: debounced.semester, academic_year: debounced.academicYear, section: scope === 'section' ? debounced.section : '' }}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog open={deleting !== null} title="Delete timetable entry" danger confirmLabel="Delete" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)}>
        Delete <strong>{deleting?.course_code}</strong> on {deleting?.day_of_week}, {formatRange(deleting?.start_time, deleting?.end_time)}? Substitutions that reference this entry may block deletion.
      </ConfirmDialog>
    </div>
  );
}
