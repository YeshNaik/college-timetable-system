import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { DateFilter, FilterBar, SelectFilter } from '../components/common/FilterBar';
import { SearchInput } from '../components/common/SearchInput';
import { AsyncBoundary } from '../components/common/States';
import { Modal } from '../components/common/Modal';
import { DetailList } from '../components/common/CrudPage';
import { useFetch } from '../hooks/useFetch';
import { auditApi } from '../api/audit.api';
import { formatDateTime } from '../utils/format';
import type { AuditLog } from '../types';

export default function AuditLogs() {
  const { data, loading, error, reload } = useFetch((s) => auditApi.list(undefined, s), []);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  const actions = useMemo(() => [...new Set((data ?? []).map((a) => a.action))].sort().map((a) => ({ value: a, label: a })), [data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (action && a.action !== action) return false;
      const d = (a.performed_at ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (q && !`${a.audit_id} ${a.substitution_id} ${a.action} ${a.action_description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, action, from, to]);

  const columns: Column<AuditLog>[] = [
    { key: 'audit_id', header: 'Audit ID', sortValue: (r) => r.audit_id },
    { key: 'substitution_id', header: 'Substitution ID', sortValue: (r) => r.substitution_id },
    { key: 'action', header: 'Action', sortValue: (r) => r.action, render: (r) => <span className="font-medium">{r.action}</span> },
    { key: 'action_description', header: 'Description', render: (r) => <span className="line-clamp-1 max-w-[380px]">{r.action_description}</span> },
    { key: 'performed_at', header: 'Performed at', sortValue: (r) => r.performed_at, render: (r) => formatDateTime(r.performed_at) },
    {
      key: 'act',
      header: '',
      className: 'w-px',
      render: (r) => (
        <button className="icon-btn" aria-label="View audit entry" onClick={(e) => { e.stopPropagation(); setViewing(r); }}>
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" description="Read-only history of actions performed on substitutions." />
      <div className="panel">
        <FilterBar>
          <div className="w-full sm:w-64">
            <label className="label">Search</label>
            <SearchInput value={search} onChange={setSearch} placeholder="ID, action or description…" />
          </div>
          <SelectFilter label="Action" value={action} onChange={setAction} options={actions} />
          <DateFilter label="From" value={from} onChange={setFrom} />
          <DateFilter label="To" value={to} onChange={setTo} />
        </FilterBar>
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.audit_id} onRowClick={setViewing} pageSize={15} emptyTitle="No audit entries found" />
        </AsyncBoundary>
      </div>
      <Modal open={viewing !== null} title="Audit entry" onClose={() => setViewing(null)}>
        {viewing && (
          <DetailList
            data={{
              'Audit ID': viewing.audit_id,
              'Substitution ID': viewing.substitution_id,
              Action: viewing.action,
              'Performed at': formatDateTime(viewing.performed_at),
              Description: viewing.action_description,
            }}
          />
        )}
      </Modal>
    </div>
  );
}
