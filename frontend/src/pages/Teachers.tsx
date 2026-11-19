import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { CalendarDays } from 'lucide-react';
import { CrudPage, type CrudFilter, type FieldDef } from '../components/common/CrudPage';
import type { Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { teachersApi } from '../api/teachers.api';
import { departmentsApi } from '../api/departments.api';
import { useFetch } from '../hooks/useFetch';
import type { Teacher } from '../types';

const schema = z.object({
  teacher_name: z.string().trim().min(2, 'Enter the teacher name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,15}$/, 'Enter a valid phone number'),
  department_id: z.coerce.number({ invalid_type_error: 'Select a department' }).int().positive('Select a department'),
  designation: z.string().trim().min(2, 'Enter the designation'),
  status: z.string().min(1, 'Select a status'),
});

export default function Teachers() {
  const navigate = useNavigate();
  const departments = useFetch((s) => departmentsApi.list(undefined, s), []);
  const deptOptions = useMemo(
    () => (departments.data ?? []).map((d) => ({ value: String(d.department_id), label: d.department_name })),
    [departments.data],
  );

  const fields: FieldDef[] = [
    { name: 'teacher_name', label: 'Full name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'department_id', label: 'Department', type: 'select', options: deptOptions },
    { name: 'designation', label: 'Designation', type: 'text', placeholder: 'e.g. Assistant Professor' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
  ];

  const columns: Column<Teacher>[] = [
    { key: 'teacher_id', header: 'ID', sortValue: (r) => r.teacher_id, className: 'w-16' },
    {
      key: 'teacher_name',
      header: 'Name',
      sortValue: (r) => r.teacher_name,
      render: (r) => (
        <button className="font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/teachers/${r.teacher_id}`); }}>
          {r.teacher_name}
        </button>
      ),
    },
    { key: 'email', header: 'Email', sortValue: (r) => r.email },
    { key: 'phone', header: 'Phone' },
    { key: 'department_name', header: 'Department', sortValue: (r) => r.department_name ?? '' },
    { key: 'designation', header: 'Designation', sortValue: (r) => r.designation },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  ];

  const filters: CrudFilter<Teacher>[] = [
    { key: 'dept', label: 'Department', options: deptOptions, predicate: (r, v) => String(r.department_id) === v },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      predicate: (r, v) => r.status?.toLowerCase() === v,
    },
  ];

  return (
    <CrudPage<Teacher>
      title="Teachers"
      description="Faculty records, qualified courses, timetables, leave and substitution history."
      singular="Teacher"
      api={teachersApi}
      getId={(r) => r.teacher_id}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ teacher_name: '', email: '', phone: '', department_id: '', designation: '', status: 'Active' }}
      searchText={(r) => `${r.teacher_id} ${r.teacher_name} ${r.email} ${r.phone} ${r.department_name ?? ''} ${r.designation}`}
      searchPlaceholder="Search name, email, phone…"
      filters={filters}
      describeRow={(r) => r.teacher_name}
      onView={(r) => navigate(`/teachers/${r.teacher_id}`)}
      rowActions={(r) => (
        <button className="icon-btn" title="Timetable" aria-label="View teacher timetable" onClick={() => navigate(`/teachers/${r.teacher_id}?tab=timetable`)}>
          <CalendarDays size={14} />
        </button>
      )}
    />
  );
}
