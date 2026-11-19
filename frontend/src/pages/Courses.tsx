import { useMemo, useState } from 'react';
import { z } from 'zod';
import { Users } from 'lucide-react';
import { CrudPage, type CrudFilter, type FieldDef } from '../components/common/CrudPage';
import type { Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { AsyncBoundary } from '../components/common/States';
import { coursesApi } from '../api/courses.api';
import { departmentsApi } from '../api/departments.api';
import { useFetch } from '../hooks/useFetch';
import { toList } from '../utils/format';
import type { Course } from '../types';

const schema = z.object({
  course_code: z.string().trim().min(2, 'Enter the course code'),
  course_name: z.string().trim().min(2, 'Enter the course name'),
  department_id: z.coerce.number({ invalid_type_error: 'Select a department' }).int().positive('Select a department'),
  credits: z.coerce.number({ invalid_type_error: 'Enter credits' }).int().min(1, 'Minimum 1').max(12, 'Maximum 12'),
});

function QualifiedTeachers({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const { data, loading, error, reload } = useFetch((s) => coursesApi.teachers(course!.course_id, s), [course?.course_id], course !== null);
  return (
    <Modal open={course !== null} title={course ? `Qualified teachers – ${course.course_code}` : ''} onClose={onClose}>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        <ul className="divide-y divide-line rounded border border-line text-[13px]">
          {(data ?? []).map((t) => (
            <li key={t.teacher_id} className="flex justify-between px-3 py-2">
              <span className="font-medium">{t.teacher_name}</span>
              <span className="text-ink-muted">{t.department_name}</span>
            </li>
          ))}
          {data?.length === 0 && <li className="px-3 py-3 text-ink-muted">No teachers are qualified for this course yet.</li>}
        </ul>
      </AsyncBoundary>
    </Modal>
  );
}

export default function Courses() {
  const [teachersFor, setTeachersFor] = useState<Course | null>(null);
  const departments = useFetch((s) => departmentsApi.list(undefined, s), []);
  const deptOptions = useMemo(
    () => (departments.data ?? []).map((d) => ({ value: String(d.department_id), label: d.department_name })),
    [departments.data],
  );

  const fields: FieldDef[] = [
    { name: 'course_code', label: 'Course code', type: 'text', placeholder: 'e.g. CS201' },
    { name: 'course_name', label: 'Course name', type: 'text' },
    { name: 'department_id', label: 'Department', type: 'select', options: deptOptions },
    { name: 'credits', label: 'Credits', type: 'number' },
  ];

  const columns: Column<Course>[] = [
    { key: 'course_id', header: 'ID', sortValue: (r) => r.course_id, className: 'w-16' },
    { key: 'course_code', header: 'Code', sortValue: (r) => r.course_code, render: (r) => <span className="font-medium">{r.course_code}</span> },
    { key: 'course_name', header: 'Course name', sortValue: (r) => r.course_name },
    { key: 'department_name', header: 'Department', sortValue: (r) => r.department_name ?? '' },
    { key: 'credits', header: 'Credits', sortValue: (r) => r.credits },
    {
      key: 'teachers',
      header: 'Assigned teachers',
      render: (r) => {
        const names = toList(r.teacher_names);
        if (names.length) return <span className="text-ink-muted">{names.slice(0, 2).join(', ')}{names.length > 2 ? ` +${names.length - 2}` : ''}</span>;
        return r.teacher_count !== undefined ? `${r.teacher_count}` : '—';
      },
    },
  ];

  const filters: CrudFilter<Course>[] = [
    { key: 'dept', label: 'Department', options: deptOptions, predicate: (r, v) => String(r.department_id) === v },
    {
      key: 'credits',
      label: 'Credits',
      options: [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} credit${n > 1 ? 's' : ''}` })),
      predicate: (r, v) => String(r.credits) === v,
    },
  ];

  return (
    <>
      <CrudPage<Course>
        title="Courses"
        description="Courses offered by each department and the teachers qualified to teach them."
        singular="Course"
        api={coursesApi}
        getId={(r) => r.course_id}
        columns={columns}
        fields={fields}
        schema={schema}
        defaultValues={{ course_code: '', course_name: '', department_id: '', credits: 3 }}
        searchText={(r) => `${r.course_code} ${r.course_name} ${r.department_name ?? ''}`}
        searchPlaceholder="Search code or name…"
        filters={filters}
        describeRow={(r) => `${r.course_code} – ${r.course_name}`}
        rowActions={(r) => (
          <button className="icon-btn" title="Qualified teachers" aria-label="View qualified teachers" onClick={() => setTeachersFor(r)}>
            <Users size={14} />
          </button>
        )}
      />
      <QualifiedTeachers course={teachersFor} onClose={() => setTeachersFor(null)} />
    </>
  );
}
