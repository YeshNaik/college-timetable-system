import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { DateFilter, FilterBar, SelectFilter } from '../components/common/FilterBar';
import { SearchInput } from '../components/common/SearchInput';
import { AsyncBoundary } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { DetailList } from '../components/common/CrudPage';
import { useFetch } from '../hooks/useFetch';
import { archiveApi } from '../api/archive.api';
import { formatDate, formatDateTime } from '../utils/format';
import type { ArchiveRecord } from '../types';

export default function Archive() {
  const { data, loading, error, reload } = useFetch((s) => archiveApi.list(undefined, s), []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [viewing, setViewing] = useState<ArchiveRecord | null>(null);

  const statuses = useMemo(() => [...new Set((data ?? []).map((a) => a.status))].sort().map((s) => ({ value: s, label: s })), [data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (status && a.status !== status) return false;
      const d = (a.substitution_date ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (q && !`${a.archive_id} ${a.substitution_id} ${a.timetable_id} ${a.absent_teacher_name} ${a.substitute_teacher_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, status, from, to]);

  const columns: Column<ArchiveRecord>[] = [
    { key: 'archive_id', header: 'Archive ID', sortValue: (r) => r.archive_id },
    { key: 'substitution_id', header: 'Substitution ID', sortValue: (r) => r.substitution_id },
    { key: 'timetable_id', header: 'Timetable ID', sortValue: (r) => r.timetable_id },
    { key: 'absent', header: 'Absent teacher', sortValue: (r) => r.absent_teacher_name ?? '', render: (r) => r.absent_teacher_name },
    { key: 'substitute', header: 'Substitute', sortValue: (r) => r.substitute_teacher_name ?? '', render: (r) => r.substitute_teacher_name },
    { key: 'substitution_date', header: 'Date', sortValue: (r) => r.substitution_date, render: (r) => formatDate(r.substitution_date) },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'archived_at', header: 'Archived', sortValue: (r) => r.archived_at, render: (r) => formatDateTime(r.archived_at) },
    {
      key: 'act',
      header: '',
      className: 'w-px',
      render: (r) => (
        <button className="icon-btn" aria-label="View archived record" onClick={(e) => { e.stopPropagation(); setViewing(r); }}>
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Substitution Archive" description="Completed substitutions moved to the archive. Records are read-only." />
      <div className="panel">
        <FilterBar>
          <div className="w-full sm:w-64">
            <label className="label">Search</label>
            <SearchInput value={search} onChange={setSearch} placeholder="Teacher or ID…" />
          </div>
          <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
          <DateFilter label="Substitution from" value={from} onChange={setFrom} />
          <DateFilter label="Substitution to" value={to} onChange={setTo} />
        </FilterBar>
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.archive_id} onRowClick={setViewing} pageSize={15} emptyTitle="No archived substitutions" />
        </AsyncBoundary>
      </div>
      <Modal open={viewing !== null} title="Archived substitution" onClose={() => setViewing(null)}>
        {viewing && (
          <DetailList
            data={{
              'Archive ID': viewing.archive_id,
              'Substitution ID': viewing.substitution_id,
              'Timetable ID': viewing.timetable_id,
              'Absent teacher': viewing.absent_teacher_name,
              'Substitute teacher': viewing.substitute_teacher_name,
              'Substitution date': formatDate(viewing.substitution_date),
              Status: viewing.status,
              'Archived at': formatDateTime(viewing.archived_at),
            }}
          />
        )}
      </Modal>
    </div>
  );
}
