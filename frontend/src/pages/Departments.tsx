import { z } from 'zod';
import { CrudPage, type CrudFilter, type FieldDef } from '../components/common/CrudPage';
import type { Column } from '../components/common/DataTable';
import { departmentsApi } from '../api/departments.api';
import { teachersApi } from '../api/teachers.api';
import { coursesApi } from '../api/courses.api';
import { useFetch } from '../hooks/useFetch';
import { AsyncBoundary } from '../components/common/States';
import type { Department } from '../types';

const schema = z.object({
  department_name: z.string().trim().min(2, 'Enter the department name'),
  department_code: z.string().trim().min(1, 'Enter a department code').max(10, 'Maximum 10 characters'),
});

const fields: FieldDef[] = [
  { name: 'department_name', label: 'Department name', type: 'text', placeholder: 'e.g. Computer Science' },
  { name: 'department_code', label: 'Department code', type: 'text', placeholder: 'e.g. CSE' },
];

const columns: Column<Department>[] = [
  { key: 'department_id', header: 'ID', sortValue: (r) => r.department_id, className: 'w-16' },
  { key: 'department_name', header: 'Department', sortValue: (r) => r.department_name, render: (r) => <span className="font-medium">{r.department_name}</span> },
  { key: 'department_code', header: 'Code', sortValue: (r) => r.department_code },
  { key: 'teacher_count', header: 'Teachers', sortValue: (r) => r.teacher_count ?? 0, render: (r) => r.teacher_count ?? '—' },
  { key: 'course_count', header: 'Courses', sortValue: (r) => r.course_count ?? 0, render: (r) => r.course_count ?? '—' },
];

const filters: CrudFilter<Department>[] = [
  {
    key: 'teachers',
    label: 'Teachers',
    options: [
      { value: 'with', label: 'With teachers' },
      { value: 'without', label: 'Without teachers' },
    ],
    predicate: (r, v) => (v === 'with' ? (r.teacher_count ?? 0) > 0 : (r.teacher_count ?? 0) === 0),
  },
  {
    key: 'courses',
    label: 'Courses',
    options: [
      { value: 'with', label: 'With courses' },
      { value: 'without', label: 'Without courses' },
    ],
    predicate: (r, v) => (v === 'with' ? (r.course_count ?? 0) > 0 : (r.course_count ?? 0) === 0),
  },
];

function DepartmentDetail({ dept }: { dept: Department }) {
  const teachers = useFetch((s) => teachersApi.list({ department_id: dept.department_id }, s), [dept.department_id]);
  const courses = useFetch((s) => coursesApi.list({ department_id: dept.department_id }, s), [dept.department_id]);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-base font-semibold">{dept.department_name}</div>
        <div className="text-xs text-ink-muted">Code: {dept.department_code}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Teachers</h3>
          <AsyncBoundary loading={teachers.loading} error={teachers.error} onRetry={teachers.reload}>
            <ul className="divide-y divide-line rounded border border-line text-[13px]">
              {(teachers.data ?? []).map((t) => (
                <li key={t.teacher_id} className="px-2.5 py-1.5">
                  {t.teacher_name} <span className="text-ink-muted">· {t.designation}</span>
                </li>
              ))}
              {teachers.data?.length === 0 && <li className="px-2.5 py-2 text-ink-muted">No teachers in this department.</li>}
            </ul>
          </AsyncBoundary>
        </section>
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Courses</h3>
          <AsyncBoundary loading={courses.loading} error={courses.error} onRetry={courses.reload}>
            <ul className="divide-y divide-line rounded border border-line text-[13px]">
              {(courses.data ?? []).map((c) => (
                <li key={c.course_id} className="px-2.5 py-1.5">
                  <span className="font-medium">{c.course_code}</span> <span className="text-ink-muted">{c.course_name}</span>
                </li>
              ))}
              {courses.data?.length === 0 && <li className="px-2.5 py-2 text-ink-muted">No courses offered.</li>}
            </ul>
          </AsyncBoundary>
        </section>
      </div>
    </div>
  );
}

export default function Departments() {
  return (
    <CrudPage<Department>
      title="Departments"
      description="Academic departments, the teachers they employ and the courses they offer."
      singular="Department"
      api={departmentsApi}
      getId={(r) => r.department_id}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ department_name: '', department_code: '' }}
      searchText={(r) => `${r.department_name} ${r.department_code}`}
      searchPlaceholder="Search by name or code…"
      filters={filters}
      describeRow={(r) => r.department_name}
      renderDetail={(r) => <DepartmentDetail dept={r} />}
    />
  );
}
