import { useMemo, useState } from 'react';
import { ArrowRight, Check, UserPlus, X } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { DateFilter, FilterBar, SelectFilter } from '../components/common/FilterBar';
import { SearchInput } from '../components/common/SearchInput';
import { AsyncBoundary, EmptyState } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { useFetch } from '../hooks/useFetch';
import { describeError } from '../api/client';
import { substitutionsApi } from '../api/substitutions.api';
import { teachersApi } from '../api/teachers.api';
import { formatDate, formatRange, todayISO } from '../utils/format';
import type { Substitution, SubstituteCandidate, TimetableEntry } from '../types';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line last:border-b-0">
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">{n}</span>
        <h2 className="panel-title">{title}</h2>
      </div>
      <div className="pb-3">{children}</div>
    </section>
  );
}

function Flow({ label, teacher, entry }: { label: string; teacher?: string; entry: TimetableEntry }) {
  const cells = [teacher ?? '—', `${entry.course_code ?? ''} ${entry.course_name ?? ''}`.trim(), `Room ${entry.room_number ?? '—'}`, formatRange(entry.start_time, entry.end_time)];
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {cells.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ArrowRight size={13} className="text-ink-muted" />}
            <span className={`rounded border px-2 py-1 ${i === 0 ? 'border-primary/30 bg-primary-soft font-medium text-primary' : 'border-line bg-white'}`}>{c}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AssignWorkflow({ onAssigned }: { onAssigned: () => void }) {
  const toast = useToast();
  const [teacherId, setTeacherId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [entry, setEntry] = useState<TimetableEntry | null>(null);
  const [candidate, setCandidate] = useState<SubstituteCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const teachers = useFetch((s) => teachersApi.list(undefined, s), []);
  const ready = !!teacherId && !!date;
  const affected = useFetch((s) => substitutionsApi.affected(Number(teacherId), date, s), [teacherId, date], ready);
  const candidates = useFetch((s) => substitutionsApi.candidates(entry!.timetable_id, date, s), [entry?.timetable_id, date], entry !== null);

  const reset = (t: string) => {
    setTeacherId(t);
    setEntry(null);
    setCandidate(null);
  };

  const assign = async () => {
    if (!entry || !candidate || !candidate.is_eligible) return;
    setBusy(true);
    setAssignError(null);
    try {
      await substitutionsApi.assign({
        timetable_id: entry.timetable_id,
        absent_teacher_id: Number(teacherId),
        substitute_teacher_id: candidate.teacher_id,
        substitution_date: date,
      });
      toast.success(`${candidate.teacher_name} assigned to ${entry.course_code ?? entry.course_name}.`);
      setCandidate(null);
      setEntry(null);
      affected.reload();
      onAssigned();
    } catch (e) {
      setAssignError(describeError(e).message);
      toast.error(describeError(e).message);
      setCandidate(null);
    } finally {
      setBusy(false);
    }
  };

  const affectedCols: Column<TimetableEntry>[] = [
    { key: 'time', header: 'Time', render: (r) => formatRange(r.start_time, r.end_time) },
    { key: 'course', header: 'Course', render: (r) => <span><span className="font-medium">{r.course_code}</span> <span className="text-ink-muted">{r.course_name}</span></span> },
    { key: 'room', header: 'Classroom', render: (r) => r.room_number },
    { key: 'section', header: 'Section', render: (r) => r.section },
    {
      key: 'act',
      header: '',
      className: 'text-right',
      render: (r) => (
        <button className={entry?.timetable_id === r.timetable_id ? 'btn-primary' : 'btn-secondary'} onClick={() => { setEntry(r); setCandidate(null); setAssignError(null); }}>
          <UserPlus size={13} /> Find substitutes
        </button>
      ),
    },
  ];

  const candCols: Column<SubstituteCandidate>[] = [
    { key: 'teacher_name', header: 'Teacher', sortValue: (r) => r.teacher_name, render: (r) => <span className="font-medium">{r.teacher_name}</span> },
    { key: 'department_name', header: 'Department' },
    { key: 'qualified_course', header: 'Qualified course', render: (r) => r.qualified_course ?? '—' },
    { key: 'is_available', header: 'Availability', render: (r) => <StatusBadge status={r.is_available ? 'Available' : 'Unavailable'} /> },
    { key: 'existing_classes', header: 'Existing classes', sortValue: (r) => r.existing_classes },
    {
      key: 'is_eligible',
      header: 'Eligibility',
      sortValue: (r) => (r.is_eligible ? 0 : 1),
      render: (r) => (
        <div>
          <StatusBadge status={r.is_eligible ? 'Eligible' : 'Ineligible'} />
          {!r.is_eligible && r.reason && <div className="mt-0.5 max-w-[220px] text-[11px] text-ink-muted">{r.reason}</div>}
        </div>
      ),
    },
    {
      key: 'act',
      header: '',
      className: 'text-right',
      render: (r) => (
        <button className="btn-primary" disabled={!r.is_eligible} title={r.is_eligible ? 'Assign this teacher' : r.reason ?? 'Not eligible'} onClick={() => setCandidate(r)}>
          Assign
        </button>
      ),
    },
  ];

  return (
    <div className="panel">
      <Step n={1} title="Select absent teacher and date">
        <div className="flex flex-wrap items-end gap-2 px-4 pt-2">
          <div className="w-64">
            <label className="label">Absent teacher</label>
            <select className="input" value={teacherId} onChange={(e) => reset(e.target.value)} aria-label="Absent teacher">
              <option value="">Select teacher…</option>
              {(teachers.data ?? []).map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.teacher_name}
                </option>
              ))}
            </select>
          </div>
          <DateFilter label="Substitution date" value={date} onChange={(v) => { setDate(v); setEntry(null); setCandidate(null); }} />
        </div>
      </Step>

      <Step n={2} title="Affected classes">
        {!ready ? (
          <EmptyState title="Choose a teacher and date" hint="Their classes on that day will appear here." />
        ) : (
          <AsyncBoundary loading={affected.loading} error={affected.error} onRetry={affected.reload}>
            <DataTable columns={affectedCols} rows={affected.data ?? []} rowKey={(r) => r.timetable_id} emptyTitle="No classes on this date" emptyHint="Nothing needs a substitute." />
          </AsyncBoundary>
        )}
      </Step>

      <Step n={3} title="Choose a substitute">
        {!entry ? (
          <EmptyState title="Select a class above" hint="Eligible teachers are determined by the server." />
        ) : (
          <>
            {assignError && <div className="mx-4 mt-2 rounded border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">{assignError}</div>}
            <AsyncBoundary loading={candidates.loading} error={candidates.error} onRetry={candidates.reload}>
              <DataTable
                columns={candCols}
                rows={[...(candidates.data ?? [])].sort((a, b) => Number(b.is_eligible) - Number(a.is_eligible))}
                rowKey={(r) => r.teacher_id}
                emptyTitle="No candidate teachers returned"
              />
            </AsyncBoundary>
          </>
        )}
      </Step>

      <ConfirmDialog open={candidate !== null && entry !== null} title="Confirm substitution" confirmLabel="Assign substitute" busy={busy} onConfirm={assign} onCancel={() => setCandidate(null)}>
        {entry && candidate && (
          <div className="space-y-3">
            <Flow label="Original" teacher={(teachers.data ?? []).find((t) => String(t.teacher_id) === teacherId)?.teacher_name} entry={entry} />
            <Flow label="Replacement" teacher={candidate.teacher_name} entry={entry} />
            <p className="text-xs text-ink-muted">Date: {formatDate(date)}. The assignment is recorded only after the server confirms it.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

function AllSubstitutions({ refreshKey }: { refreshKey: number }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch((s) => substitutionsApi.list(undefined, s), [refreshKey]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [action, setAction] = useState<{ sub: Substitution; kind: 'confirm' | 'cancel' } | null>(null);
  const [busy, setBusy] = useState(false);

  const statuses = useMemo(() => [...new Set((data ?? []).map((s) => s.status))].sort().map((s) => ({ value: s, label: s })), [data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      if (status && s.status !== status) return false;
      if (from && s.substitution_date.slice(0, 10) < from) return false;
      if (to && s.substitution_date.slice(0, 10) > to) return false;
      if (q && !`${s.absent_teacher_name} ${s.substitute_teacher_name} ${s.course_name} ${s.course_code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, status, from, to]);

  const run = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === 'confirm') await substitutionsApi.confirm(action.sub.substitution_id);
      else await substitutionsApi.cancel(action.sub.substitution_id);
      toast.success(`Substitution ${action.kind === 'confirm' ? 'confirmed' : 'cancelled'}.`);
      setAction(null);
      reload();
    } catch (e) {
      toast.error(describeError(e).message);
      setAction(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Substitution>[] = [
    { key: 'substitution_id', header: 'ID', sortValue: (r) => r.substitution_id, className: 'w-14' },
    { key: 'absent', header: 'Absent teacher', sortValue: (r) => r.absent_teacher_name ?? '', render: (r) => r.absent_teacher_name },
    { key: 'substitute', header: 'Substitute', sortValue: (r) => r.substitute_teacher_name ?? '', render: (r) => <span className="font-medium">{r.substitute_teacher_name}</span> },
    { key: 'course', header: 'Course', render: (r) => r.course_code ?? r.course_name },
    { key: 'room', header: 'Classroom', render: (r) => r.room_number },
    { key: 'section', header: 'Section', render: (r) => r.section },
    { key: 'slot', header: 'Time slot', render: (r) => `${r.day_of_week?.slice(0, 3) ?? ''} ${formatRange(r.start_time, r.end_time)}` },
    { key: 'date', header: 'Date', sortValue: (r) => r.substitution_date, render: (r) => formatDate(r.substitution_date) },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'act',
      header: 'Actions',
      className: 'w-px text-right',
      render: (r) => {
        const st = r.status.toLowerCase();
        return (
          <div className="flex justify-end gap-0.5">
            {['assigned', 'pending'].includes(st) && (
              <button className="icon-btn hover:!text-success" title="Confirm" aria-label="Confirm substitution" onClick={() => setAction({ sub: r, kind: 'confirm' })}>
                <Check size={15} />
              </button>
            )}
            {['assigned', 'pending', 'confirmed'].includes(st) && (
              <button className="icon-btn hover:!text-danger" title="Cancel" aria-label="Cancel substitution" onClick={() => setAction({ sub: r, kind: 'cancel' })}>
                <X size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="panel">
      <FilterBar>
        <div className="w-full sm:w-60">
          <label className="label">Search</label>
          <SearchInput value={search} onChange={setSearch} placeholder="Teacher or course…" />
        </div>
        <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
        <DateFilter label="From" value={from} onChange={setFrom} />
        <DateFilter label="To" value={to} onChange={setTo} />
      </FilterBar>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.substitution_id} emptyTitle="No substitutions found" />
      </AsyncBoundary>
      <ConfirmDialog
        open={action !== null}
        title={action?.kind === 'confirm' ? 'Confirm substitution' : 'Cancel substitution'}
        danger={action?.kind === 'cancel'}
        confirmLabel={action?.kind === 'confirm' ? 'Confirm' : 'Cancel substitution'}
        busy={busy}
        onConfirm={run}
        onCancel={() => setAction(null)}
      >
        {action?.kind === 'confirm' ? 'Confirm' : 'Cancel'} the substitution of <strong>{action?.sub.substitute_teacher_name}</strong> for{' '}
        <strong>{action?.sub.absent_teacher_name}</strong> on {formatDate(action?.sub.substitution_date)}?
      </ConfirmDialog>
    </div>
  );
}

export default function Substitutions() {
  const [tab, setTab] = useState<'assign' | 'all'>('assign');
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div>
      <PageHeader title="Substitution Management" description="Find eligible substitutes for an absent teacher's classes and manage assignments." />
      <div className="mb-3 inline-flex rounded border border-line bg-white p-0.5 text-[13px]" role="tablist">
        {([['assign', 'Assign substitute'], ['all', 'All substitutions']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded px-3 py-1.5 ${tab === k ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'assign' ? <AssignWorkflow onAssigned={() => setRefreshKey((k) => k + 1)} /> : <AllSubstitutions refreshKey={refreshKey} />}
    </div>
  );
}
