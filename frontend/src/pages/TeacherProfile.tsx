import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookPlus } from 'lucide-react';
import { teachersApi } from '../api/teachers.api';
import { coursesApi } from '../api/courses.api';
import { useFetch } from '../hooks/useFetch';
import { describeError } from '../api/client';
import { AsyncBoundary, EmptyState } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { TimetableGrid } from '../components/timetable/TimetableGrid';
import { formatDate, formatRange } from '../utils/format';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'courses', label: 'Qualified courses' },
  { key: 'timetable', label: 'Weekly timetable' },
  { key: 'leaves', label: 'Leave history' },
  { key: 'substitutions', label: 'Substitution history' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="border-b border-line/70 pb-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px]">{value || '—'}</dd>
    </div>
  );
}

export default function TeacherProfile() {
  const { id } = useParams();
  const teacherId = Number(id);
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.key === params.get('tab'))?.key ?? 'overview') as TabKey;
  const toast = useToast();

  const teacher = useFetch((s) => teachersApi.get(teacherId, s), [teacherId]);
  const courses = useFetch((s) => teachersApi.courses(teacherId, s), [teacherId], tab === 'courses' || tab === 'overview');
  const timetable = useFetch((s) => teachersApi.timetable(teacherId, s), [teacherId], tab === 'timetable');
  const leaves = useFetch((s) => teachersApi.leaves(teacherId, s), [teacherId], tab === 'leaves');
  const subs = useFetch((s) => teachersApi.substitutions(teacherId, s), [teacherId], tab === 'substitutions');

  const [assignOpen, setAssignOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const allCourses = useFetch((s) => coursesApi.list(undefined, s), [], assignOpen);

  useEffect(() => {
    if (assignOpen) {
      setSelected(new Set((courses.data ?? []).map((c) => c.course_id)));
      setSaveError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignOpen]);

  const saveCourses = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await teachersApi.assignCourses(teacherId, [...selected]);
      toast.success('Qualified courses updated.');
      setAssignOpen(false);
      courses.reload();
    } catch (e) {
      setSaveError(describeError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const t = teacher.data;
  return (
    <div>
      <Link to="/teachers" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> All teachers
      </Link>

      <AsyncBoundary loading={teacher.loading} error={teacher.error} onRetry={teacher.reload}>
        {t && (
          <>
            <div className="panel mb-4 flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-primary-soft text-[15px] font-semibold text-primary">
                {t.teacher_name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold leading-tight">{t.teacher_name}</h1>
                <p className="text-[13px] text-ink-muted">
                  {t.designation} · {t.department_name ?? `Department #${t.department_id}`}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-ink-muted">
                <span>ID {t.teacher_id}</span>
                <StatusBadge status={t.status} />
              </div>
            </div>

            <div className="panel">
              <div className="flex gap-1 overflow-x-auto border-b border-line px-2" role="tablist">
                {TABS.map((x) => (
                  <button
                    key={x.key}
                    role="tab"
                    aria-selected={tab === x.key}
                    onClick={() => setParams({ tab: x.key })}
                    className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] ${
                      tab === x.key ? 'border-primary font-medium text-primary' : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div className="grid gap-6 p-5 md:grid-cols-2">
                  <section>
                    <h2 className="panel-title mb-3">Personal information</h2>
                    <dl className="space-y-2.5">
                      <Info label="Full name" value={t.teacher_name} />
                      <Info label="Email" value={t.email} />
                      <Info label="Phone" value={t.phone} />
                    </dl>
                  </section>
                  <section>
                    <h2 className="panel-title mb-3">Department information</h2>
                    <dl className="space-y-2.5">
                      <Info label="Department" value={t.department_name} />
                      <Info label="Designation" value={t.designation} />
                      <Info label="Status" value={t.status} />
                      <Info label="Qualified courses" value={courses.data ? courses.data.length : undefined} />
                    </dl>
                  </section>
                </div>
              )}

              {tab === 'courses' && (
                <div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="panel-title">Qualified courses</h2>
                    <button className="btn-secondary" onClick={() => setAssignOpen(true)}>
                      <BookPlus size={14} /> Assign courses
                    </button>
                  </div>
                  <AsyncBoundary loading={courses.loading} error={courses.error} onRetry={courses.reload}>
                    <DataTable
                      rowKey={(r) => r.course_id}
                      rows={courses.data ?? []}
                      emptyTitle="No qualified courses"
                      emptyHint="Assign the courses this teacher can teach or substitute for."
                      columns={[
                        { key: 'course_code', header: 'Code', render: (r) => <span className="font-medium">{r.course_code}</span> },
                        { key: 'course_name', header: 'Course' },
                        { key: 'department_name', header: 'Department' },
                        { key: 'credits', header: 'Credits' },
                      ]}
                    />
                  </AsyncBoundary>
                </div>
              )}

              {tab === 'timetable' && (
                <AsyncBoundary loading={timetable.loading} error={timetable.error} onRetry={timetable.reload}>
                  <TimetableGrid entries={timetable.data ?? []} showTeacher={false} />
                </AsyncBoundary>
              )}

              {tab === 'leaves' && (
                <AsyncBoundary loading={leaves.loading} error={leaves.error} onRetry={leaves.reload}>
                  <DataTable
                    rowKey={(r) => r.leave_id}
                    rows={leaves.data ?? []}
                    emptyTitle="No leave history"
                    columns={[
                      { key: 'leave_id', header: 'ID' },
                      { key: 'start_date', header: 'From', render: (r) => formatDate(r.start_date) },
                      { key: 'end_date', header: 'To', render: (r) => formatDate(r.end_date) },
                      { key: 'reason', header: 'Reason' },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                  />
                </AsyncBoundary>
              )}

              {tab === 'substitutions' && (
                <AsyncBoundary loading={subs.loading} error={subs.error} onRetry={subs.reload}>
                  <DataTable
                    rowKey={(r) => r.substitution_id}
                    rows={subs.data ?? []}
                    emptyTitle="No substitution history"
                    columns={[
                      { key: 'substitution_id', header: 'ID' },
                      { key: 'substitution_date', header: 'Date', render: (r) => formatDate(r.substitution_date) },
                      {
                        key: 'role',
                        header: 'Role',
                        render: (r) => (r.absent_teacher_id === teacherId ? 'Absent (covered by ' + (r.substitute_teacher_name ?? '—') + ')' : 'Substitute (for ' + (r.absent_teacher_name ?? '—') + ')'),
                      },
                      { key: 'course', header: 'Course', render: (r) => r.course_code ?? r.course_name ?? '—' },
                      { key: 'time', header: 'Time', render: (r) => formatRange(r.start_time, r.end_time) },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                    ]}
                  />
                </AsyncBoundary>
              )}
            </div>
          </>
        )}
        {!t && !teacher.loading && !teacher.error && <EmptyState title="Teacher not found" />}
      </AsyncBoundary>

      <Modal
        open={assignOpen}
        title="Assign qualified courses"
        onClose={() => setAssignOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveCourses} disabled={saving}>
              {saving ? 'Saving…' : 'Save courses'}
            </button>
          </>
        }
      >
        {saveError && <div className="mb-3 rounded border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger">{saveError}</div>}
        <AsyncBoundary loading={allCourses.loading} error={allCourses.error} onRetry={allCourses.reload}>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded border border-line">
            {(allCourses.data ?? []).map((c) => (
              <li key={c.course_id}>
                <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-app/60">
                  <input
                    type="checkbox"
                    checked={selected.has(c.course_id)}
                    onChange={(e) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(c.course_id);
                        else n.delete(c.course_id);
                        return n;
                      })
                    }
                  />
                  <span className="font-medium">{c.course_code}</span>
                  <span className="text-ink-muted">{c.course_name}</span>
                </label>
              </li>
            ))}
          </ul>
        </AsyncBoundary>
      </Modal>
    </div>
  );
}
