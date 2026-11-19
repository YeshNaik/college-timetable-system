import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { useToast } from '../common/Toast';
import { useFetch } from '../../hooks/useFetch';
import { describeError } from '../../api/client';
import { coursesApi } from '../../api/courses.api';
import { teachersApi } from '../../api/teachers.api';
import { classroomsApi } from '../../api/classrooms.api';
import { timeSlotsApi } from '../../api/timeSlots.api';
import { timetableApi } from '../../api/timetable.api';
import { dayIndex, formatRange } from '../../utils/format';
import type { TimetableEntry } from '../../types';

const schema = z.object({
  course_id: z.coerce.number({ invalid_type_error: 'Select a course' }).int().positive('Select a course'),
  teacher_id: z.coerce.number({ invalid_type_error: 'Select a teacher' }).int().positive('Select a teacher'),
  classroom_id: z.coerce.number({ invalid_type_error: 'Select a classroom' }).int().positive('Select a classroom'),
  slot_id: z.coerce.number({ invalid_type_error: 'Select a time slot' }).int().positive('Select a time slot'),
  section: z.string().trim().min(1, 'Enter the section'),
  semester: z.string().trim().min(1, 'Enter the semester'),
  academic_year: z.string().trim().regex(/^\d{4}(-\d{2,4})?$/, 'Use a format like 2025-26'),
});

type FormValues = Record<string, unknown>;

interface Props {
  open: boolean;
  entry: TimetableEntry | null; // null => create
  defaults?: Partial<Record<'semester' | 'academic_year' | 'section', string>>;
  onClose: () => void;
  onSaved: () => void;
}

export function EntryFormModal({ open, entry, defaults, onClose, onSaved }: Props) {
  const toast = useToast();
  const courses = useFetch((s) => coursesApi.list(undefined, s), [], open);
  const teachers = useFetch((s) => teachersApi.list(undefined, s), [], open);
  const rooms = useFetch((s) => classroomsApi.list(undefined, s), [], open);
  const slots = useFetch((s) => timeSlotsApi.list(undefined, s), [], open);
  const [problem, setProblem] = useState<{ message: string; conflicts: string[] } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    setProblem(null);
    reset(
      entry
        ? { ...entry }
        : { course_id: '', teacher_id: '', classroom_id: '', slot_id: '', section: defaults?.section ?? '', semester: defaults?.semester ?? '', academic_year: defaults?.academic_year ?? '' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry]);

  const sortedSlots = useMemo(
    () => [...(slots.data ?? [])].sort((a, b) => dayIndex(a.day_of_week) - dayIndex(b.day_of_week) || a.start_time.localeCompare(b.start_time)),
    [slots.data],
  );

  const submit = handleSubmit(async (values) => {
    setProblem(null);
    try {
      if (entry) await timetableApi.update(entry.timetable_id, values as Partial<TimetableEntry>);
      else await timetableApi.create(values as Partial<TimetableEntry>);
      toast.success(entry ? 'Timetable entry updated.' : 'Timetable entry created.');
      onSaved();
      onClose();
    } catch (e) {
      const info = describeError(e);
      setProblem({ message: info.message, conflicts: info.conflicts });
    }
  });

  const loadError = courses.error || teachers.error || rooms.error || slots.error;

  return (
    <Modal
      open={open}
      title={entry ? 'Edit timetable entry' : 'Add timetable entry'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" form="entry-form" disabled={isSubmitting || !!loadError}>
            {isSubmitting ? 'Checking & saving…' : 'Save entry'}
          </button>
        </>
      }
    >
      <form id="entry-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
        {loadError && <div className="rounded border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger sm:col-span-2">{loadError}</div>}
        {problem && (
          <div className="rounded border border-danger/40 bg-danger-soft px-3 py-2.5 text-[13px] sm:col-span-2" role="alert">
            <div className="flex items-center gap-1.5 font-medium text-danger">
              <AlertTriangle size={15} /> This entry could not be saved
            </div>
            <p className="mt-1 text-ink">{problem.message}</p>
            {problem.conflicts.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-ink">
                {problem.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <FormField label="Course" htmlFor="e-course" error={errors.course_id?.message as string}>
          <select id="e-course" className="input" {...register('course_id')}>
            <option value="">Select…</option>
            {(courses.data ?? []).map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} – {c.course_name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Teacher" htmlFor="e-teacher" error={errors.teacher_id?.message as string}>
          <select id="e-teacher" className="input" {...register('teacher_id')}>
            <option value="">Select…</option>
            {(teachers.data ?? []).map((t) => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.teacher_name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Classroom" htmlFor="e-room" error={errors.classroom_id?.message as string}>
          <select id="e-room" className="input" {...register('classroom_id')}>
            <option value="">Select…</option>
            {(rooms.data ?? []).map((r) => (
              <option key={r.classroom_id} value={r.classroom_id}>
                {r.room_number} · {r.building}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Time slot" htmlFor="e-slot" error={errors.slot_id?.message as string}>
          <select id="e-slot" className="input" {...register('slot_id')}>
            <option value="">Select…</option>
            {sortedSlots.map((s) => (
              <option key={s.slot_id} value={s.slot_id}>
                {s.day_of_week.slice(0, 3)} · {formatRange(s.start_time, s.end_time)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Section" htmlFor="e-section" error={errors.section?.message as string}>
          <input id="e-section" className="input" placeholder="e.g. A" {...register('section')} />
        </FormField>
        <FormField label="Semester" htmlFor="e-sem" error={errors.semester?.message as string}>
          <input id="e-sem" className="input" placeholder="e.g. 3" {...register('semester')} />
        </FormField>
        <FormField label="Academic year" htmlFor="e-year" error={errors.academic_year?.message as string}>
          <input id="e-year" className="input" placeholder="e.g. 2025-26" {...register('academic_year')} />
        </FormField>
      </form>
    </Modal>
  );
}
