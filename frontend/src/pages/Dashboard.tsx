import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { AsyncBoundary, EmptyState } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { useFetch } from '../hooks/useFetch';
import { dashboardApi } from '../api/dashboard.api';
import { formatDate, formatRange } from '../utils/format';

function Panel({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="panel-title">{title}</h2>
        {to && (
          <Link to={to} className="text-xs text-secondary hover:underline">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function MiniTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px]">
        <thead className="border-b border-line bg-app/70">
          <tr>
            {head.map((h) => (
              <th key={h} className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="td">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartBox({ data, x, y, label }: { data: Record<string, unknown>[]; x: string; y: string; label: string }) {
  if (data.length === 0) return <EmptyState title="No data available" />;
  return (
    <div className="h-56 px-2 py-3" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={x} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#F6F7F9' }} contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #E5E7EB' }} />
          <Bar dataKey={y} fill="#426A9B" radius={[2, 2, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch((s) => dashboardApi.summary(s), []);

  const stat = (label: string, value?: number, to?: string) => ({ label, value, to });
  const s = data?.stats;
  const stats = [
    stat('Teachers', s?.total_teachers, '/teachers'),
    stat('Departments', s?.total_departments, '/departments'),
    stat('Courses', s?.total_courses, '/courses'),
    stat('Classrooms', s?.total_classrooms, '/classrooms'),
    stat("Today's classes", s?.todays_classes, '/timetable'),
    stat('On approved leave', s?.teachers_on_leave, '/leaves'),
    stat('Substitutions assigned', s?.substitutions_assigned, '/substitutions'),
    stat('Pending leave requests', s?.pending_leaves, '/leaves?status=Pending'),
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Operational overview of today's timetable, leave and substitutions." />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-4">
            <div className="panel grid grid-cols-2 divide-x divide-y divide-line overflow-hidden md:grid-cols-4">
              {stats.map((x) => (
                <Link key={x.label} to={x.to ?? '/'} className="px-4 py-3 hover:bg-app/60">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{x.label}</div>
                  <div className="mt-0.5 text-xl font-semibold tabular-nums">{x.value ?? '—'}</div>
                </Link>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Panel title="Today's timetable" to="/timetable">
                  <MiniTable
                    head={['Time', 'Course', 'Teacher', 'Room', 'Section']}
                    empty="No classes scheduled today"
                    rows={(data.today_timetable ?? []).map((e) => [
                      <span className="whitespace-nowrap">{formatRange(e.start_time, e.end_time)}</span>,
                      <span>
                        <span className="font-medium">{e.course_code}</span> <span className="text-ink-muted">{e.course_name}</span>
                      </span>,
                      e.teacher_name,
                      e.room_number,
                      e.section,
                    ])}
                  />
                </Panel>
              </div>
              <Panel title="Teachers on leave" to="/leaves">
                <MiniTable
                  head={['Teacher', 'Until']}
                  empty="No teachers on leave"
                  rows={(data.teachers_on_leave ?? []).map((l) => [l.teacher_name, formatDate(l.end_date)])}
                />
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Recent substitution assignments" to="/substitutions">
                <MiniTable
                  head={['Date', 'Absent', 'Substitute', 'Course', 'Status']}
                  empty="No substitutions yet"
                  rows={(data.recent_substitutions ?? []).map((x) => [
                    formatDate(x.substitution_date),
                    x.absent_teacher_name,
                    x.substitute_teacher_name,
                    x.course_code ?? x.course_name,
                    <StatusBadge status={x.status} />,
                  ])}
                />
              </Panel>
              <Panel title="Pending leave requests" to="/leaves?status=Pending">
                <MiniTable
                  head={['Teacher', 'From', 'To', 'Reason']}
                  empty="No pending requests"
                  rows={(data.pending_leaves ?? []).map((l) => [l.teacher_name, formatDate(l.start_date), formatDate(l.end_date), <span className="line-clamp-1">{l.reason}</span>])}
                />
              </Panel>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Weekly class distribution">
                <ChartBox data={data.weekly_distribution ?? []} x="day" y="count" label="Classes per weekday" />
              </Panel>
              <Panel title="Teachers by department">
                <ChartBox data={data.department_distribution ?? []} x="department_name" y="teacher_count" label="Teachers per department" />
              </Panel>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
