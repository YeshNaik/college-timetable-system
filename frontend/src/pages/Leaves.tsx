import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Eye, Plus, X } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { FilterBar, SelectFilter, DateFilter } from '../components/common/FilterBar';
import { SearchInput } from '../components/common/SearchInput';
import { AsyncBoundary } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FormField } from '../components/common/FormField';
import { DetailList } from '../components/common/CrudPage';
import { useToast } from '../components/common/Toast';
import { useFetch } from '../hooks/useFetch';
import { describeError } from '../api/client';
import { leavesApi } from '../api/leaves.api';
import { teachersApi } from '../api/teachers.api';
import { formatDate, formatRange, todayISO } from '../utils/format';
import type { Leave } from '../types';

const schema = z
  .object({
    teacher_id: z.coerce.number({ invalid_type_error: 'Select a teacher' }).int().positive('Select a teacher'),
    start_date: z.string().min(1, 'Select a start date'),
    end_date: z.string().min(1, 'Select an end date'),
    reason: z.string().trim().min(3, 'Enter a reason'),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, { path: ['end_date'], message: 'End date cannot be before start date' });

function LeaveDetail({ leave, onClose, onAction }: { leave: Leave | null; onClose: () => void; onAction: (l: Leave, a: 'approve' | 'reject') => void }) {
  const isApproved = leave?.status.toLowerCase() === 'approved';
  const affected = useFetch((s) => leavesApi.affectedEntries(leave!.leave_id, s), [leave?.leave_id], leave !== null && isApproved);
  const pending = leave?.status.toLowerCase() === 'pending';
  return (
    <Modal
      open={leave !== null}
      title="Leave details"
      size="lg"
      onClose={onClose}
      footer={
        leave &&
        pending && (
          <>
            <button className="btn-secondary" onClick={() => onAction(leave, 'reject')}>
              <X size={14} /> Reject
            </button>
            <button className="btn-primary" onClick={() => onAction(leave, 'approve')}>
              <Check size={14} /> Approve
            </button>
          </>
        )
      }
    >
      {leave && (
        <div className="space-y-4">
          <DetailList
            data={{
              'Leave ID': leave.leave_id,
              Teacher: leave.teacher_name,
              Department: leave.department_name,
              'Start date': formatDate(leave.start_date),
              'End date': formatDate(leave.end_date),
              Status: leave.status,
              'Applied on': leave.applied_on ? formatDate(leave.applied_on) : undefined,
              Reason: leave.reason,
            }}
          />
          {isApproved && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Affected timetable entries</h3>
              <div className="rounded border border-line">
                <AsyncBoundary loading={affected.loading} error={affected.error} onRetry={affected.reload}>
                  <DataTable
                    pageSize={6}
                    rowKey={(r) => r.timetable_id}
                    rows={affected.data ?? []}
                    emptyTitle="No classes fall within this leave"
                    columns={[
                      { key: 'day', header: 'Day', render: (r) => r.day_of_week },
                      { key: 'time', header: 'Time', render: (r) => formatRange(r.start_time, r.end_time) },
                      { key: 'course', header: 'Course', render: (r) => r.course_code ?? r.course_name },
                      { key: 'room', header: 'Room', render: (r) => r.room_number },
                      { key: 'section', header: 'Section', render: (r) => r.section },
                    ]}
                  />
                </AsyncBoundary>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Leaves() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, loading, error, reload } = useFetch((s) => leavesApi.list(undefined, s), []);
  const teachers = useFetch((s) => teachersApi.list(undefined, s), []);

  const [applyOpen, setApplyOpen] = useState(false);
  const [viewing, setViewing] = useState<Leave | null>(null);
  const [decision, setDecision] = useState<{ leave: Leave; action: 'approve' | 'reject' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (applyOpen) {
      setServerError(null);
      reset({ teacher_id: '', start_date: todayISO(), end_date: todayISO(), reason: '' });
    }
  }, [applyOpen, reset]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((l) => {
      if (status && l.status.toLowerCase() !== status.toLowerCase()) return false;
      if (q && !(l.teacher_name ?? '').toLowerCase().includes(q)) return false;
      if (from && l.end_date.slice(0, 10) < from) return false;
      if (to && l.start_date.slice(0, 10) > to) return false;
      return true;
    });
  }, [data, status, search, from, to]);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await leavesApi.create(values as Partial<Leave>);
      toast.success('Leave application submitted.');
      setApplyOpen(false);
      reload();
    } catch (e) {
      setServerError(describeError(e).message);
    }
  });

  const confirmDecision = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      if (decision.action === 'approve') await leavesApi.approve(decision.leave.leave_id);
      else await leavesApi.reject(decision.leave.leave_id);
      toast.success(`Leave ${decision.action === 'approve' ? 'approved' : 'rejected'}.`);
      setDecision(null);
      setViewing(null);
      reload();
    } catch (e) {
      toast.error(describeError(e).message);
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Leave>[] = [
    { key: 'leave_id', header: 'ID', sortValue: (r) => r.leave_id, className: 'w-14' },
    { key: 'teacher_name', header: 'Teacher', sortValue: (r) => r.teacher_name ?? '', render: (r) => <span className="font-medium">{r.teacher_name}</span> },
    { key: 'start_date', header: 'From', sortValue: (r) => r.start_date, render: (r) => formatDate(r.start_date) },
    { key: 'end_date', header: 'To', sortValue: (r) => r.end_date, render: (r) => formatDate(r.end_date) },
    { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-1 max-w-[240px]">{r.reason}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'applied_on', header: 'Applied', sortValue: (r) => r.applied_on ?? '', render: (r) => formatDate(r.applied_on) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-px text-right',
      render: (r) => {
        const pending = r.status.toLowerCase() === 'pending';
        return (
          <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn" title="View" aria-label="View leave" onClick={() => setViewing(r)}>
              <Eye size={15} />
            </button>
            {pending && (
              <>
                <button className="icon-btn hover:!text-success" title="Approve" aria-label="Approve leave" onClick={() => setDecision({ leave: r, action: 'approve' })}>
                  <Check size={15} />
                </button>
                <button className="icon-btn hover:!text-danger" title="Reject" aria-label="Reject leave" onClick={() => setDecision({ leave: r, action: 'reject' })}>
                  <X size={15} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Teacher leave applications, approvals and the classes they affect."
        actions={
          <button className="btn-primary" onClick={() => setApplyOpen(true)}>
            <Plus size={14} /> Submit leave
          </button>
        }
      />
      <div className="panel">
        <FilterBar>
          <div className="w-full sm:w-60">
            <label className="label">Search teacher</label>
            <SearchInput value={search} onChange={setSearch} placeholder="Teacher name…" />
          </div>
          <SelectFilter
            label="Status"
            value={status}
            onChange={(v) => setParams(v ? { status: v } : {})}
            options={['Pending', 'Approved', 'Rejected'].map((s) => ({ value: s, label: s }))}
          />
          <DateFilter label="Leave from" value={from} onChange={setFrom} />
          <DateFilter label="Leave until" value={to} onChange={setTo} />
          {(from || to) && (
            <button className="btn-ghost" onClick={() => { setFrom(''); setTo(''); }}>
              Clear dates
            </button>
          )}
        </FilterBar>
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.leave_id} onRowClick={setViewing} emptyTitle="No leave applications found" emptyHint="Adjust the filters or submit a new application." />
        </AsyncBoundary>
      </div>

      <LeaveDetail leave={viewing} onClose={() => setViewing(null)} onAction={(leave, action) => setDecision({ leave, action })} />

      <Modal
        open={applyOpen}
        title="Submit leave application"
        onClose={() => setApplyOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setApplyOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" form="leave-form" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <form id="leave-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
          {serverError && <div className="rounded border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger sm:col-span-2" role="alert">{serverError}</div>}
          <div className="sm:col-span-2">
            <FormField label="Teacher" htmlFor="l-teacher" error={errors.teacher_id?.message as string}>
              <select id="l-teacher" className="input" {...register('teacher_id')}>
                <option value="">Select…</option>
                {(teachers.data ?? []).map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>
                    {t.teacher_name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Start date" htmlFor="l-start" error={errors.start_date?.message as string}>
            <input id="l-start" type="date" className="input" {...register('start_date')} />
          </FormField>
          <FormField label="End date" htmlFor="l-end" error={errors.end_date?.message as string}>
            <input id="l-end" type="date" className="input" {...register('end_date')} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Reason" htmlFor="l-reason" error={errors.reason?.message as string}>
              <textarea id="l-reason" rows={3} className="input" {...register('reason')} />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={decision !== null}
        title={decision?.action === 'approve' ? 'Approve leave' : 'Reject leave'}
        danger={decision?.action === 'reject'}
        confirmLabel={decision?.action === 'approve' ? 'Approve' : 'Reject'}
        busy={busy}
        onConfirm={confirmDecision}
        onCancel={() => setDecision(null)}
      >
        {decision?.action === 'approve' ? 'Approve' : 'Reject'} the leave of <strong>{decision?.leave.teacher_name}</strong> from {formatDate(decision?.leave.start_date)} to{' '}
        {formatDate(decision?.leave.end_date)}?
      </ConfirmDialog>
    </div>
  );
}
