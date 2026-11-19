import { useMemo, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { DateFilter, FilterBar, SelectFilter } from '../components/common/FilterBar';
import { SearchInput } from '../components/common/SearchInput';
import { AsyncBoundary } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { useFetch } from '../hooks/useFetch';
import { teachersApi } from '../api/teachers.api';
import { toList, todayISO } from '../utils/format';
import type { AvailabilityRow } from '../types';

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <span className="text-ink-muted">{empty}</span>;
  return (
    <div className="flex max-w-[320px] flex-wrap gap-1">
      {items.map((i) => (
        <span key={i} className="rounded border border-line bg-app px-1.5 py-0.5 text-[11px] text-ink">
          {i}
        </span>
      ))}
    </div>
  );
}

export default function TeacherAvailability() {
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [leave, setLeave] = useState('');

  const { data, loading, error, reload } = useFetch((s) => teachersApi.availability({ date }, s), [date], !!date);

  const departments = useMemo(
    () => [...new Set((data ?? []).map((r) => r.department_name).filter((x): x is string => !!x))].sort().map((d) => ({ value: d, label: d })),
    [data],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (dept && r.department_name !== dept) return false;
      if (leave === 'leave' && !r.on_leave) return false;
      if (leave === 'present' && r.on_leave) return false;
      if (q && !`${r.teacher_name} ${toList(r.qualified_courses).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, dept, leave]);

  const columns: Column<AvailabilityRow>[] = [
    { key: 'teacher_name', header: 'Teacher', sortValue: (r) => r.teacher_name, render: (r) => <span className="font-medium">{r.teacher_name}</span> },
    { key: 'department_name', header: 'Department', sortValue: (r) => r.department_name ?? '' },
    { key: 'qualified_courses', header: 'Qualified courses', render: (r) => <Chips items={toList(r.qualified_courses)} empty="None assigned" /> },
    { key: 'scheduled_classes', header: 'Classes that day', sortValue: (r) => r.scheduled_classes, render: (r) => r.scheduled_classes },
    { key: 'on_leave', header: 'Leave', sortValue: (r) => (r.on_leave ? 1 : 0), render: (r) => <StatusBadge status={r.on_leave ? 'On leave' : 'Available'} /> },
    { key: 'available_slots', header: 'Free time slots', render: (r) => (r.on_leave ? <span className="text-ink-muted">—</span> : <Chips items={toList(r.available_slots)} empty="No free slots" />) },
  ];

  return (
    <div>
      <PageHeader title="Teacher Availability" description="Who is free on a given date, to help identify suitable substitutes. Availability is calculated by the server." />
      <div className="panel">
        <FilterBar>
          <DateFilter label="Date" value={date} onChange={setDate} />
          <div className="w-full sm:w-60">
            <label className="label">Search</label>
            <SearchInput value={search} onChange={setSearch} placeholder="Teacher or course…" />
          </div>
          <SelectFilter label="Department" value={dept} onChange={setDept} options={departments} />
          <SelectFilter
            label="Leave status"
            value={leave}
            onChange={setLeave}
            options={[
              { value: 'present', label: 'Not on leave' },
              { value: 'leave', label: 'On leave' },
            ]}
          />
        </FilterBar>
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.teacher_id} emptyTitle="No teachers match" emptyHint="Change the date or filters." />
        </AsyncBoundary>
      </div>
    </div>
  );
}
