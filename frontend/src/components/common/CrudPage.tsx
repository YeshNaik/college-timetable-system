import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodTypeAny } from 'zod';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Crud } from '../../api/client';
import { describeError } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { PageHeader } from './PageHeader';
import { DataTable, type Column } from './DataTable';
import { SearchInput } from './SearchInput';
import { FilterBar, SelectFilter, type Option } from './FilterBar';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { FormField } from './FormField';
import { AsyncBoundary } from './States';
import { useToast } from './Toast';
import { humanize } from '../../utils/format';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | 'time';
  options?: Option[];
  placeholder?: string;
}

export interface CrudFilter<T> {
  key: string;
  label: string;
  options: Option[];
  predicate: (row: T, value: string) => boolean;
}

export interface RowHandlers<T> {
  edit: (row: T) => void;
  remove: (row: T) => void;
  view: (row: T) => void;
}

interface Props<T extends object> {
  title: string;
  description: string;
  singular: string;
  api: Crud<T>;
  getId: (row: T) => number;
  columns: Column<T>[];
  fields: FieldDef[];
  schema: ZodTypeAny;
  defaultValues: Record<string, unknown>;
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  filters?: CrudFilter<T>[];
  rowActions?: (row: T) => ReactNode;
  /** Replace the default detail modal (e.g. navigate to a profile page). */
  onView?: (row: T) => void;
  renderDetail?: (row: T) => ReactNode;
  describeRow: (row: T) => string;
  alternateView?: { label: string; render: (rows: T[], h: RowHandlers<T>) => ReactNode };
  /** Extra header actions. */
  extraActions?: ReactNode;
}

export function CrudPage<T extends object>(props: Props<T>) {
  const { title, description, singular, api, getId, columns, fields, schema, defaultValues, searchText } = props;
  const toast = useToast();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch((signal) => api.list(undefined, signal), []);

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'table' | 'alt'>('table');
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [viewing, setViewing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    setSearch(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    if (editing === null) return;
    setServerError(null);
    reset(editing === 'new' ? defaultValues : ({ ...defaultValues, ...(editing as Record<string, unknown>) } as Record<string, unknown>));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (q && !searchText(r).toLowerCase().includes(q)) return false;
      return (props.filters ?? []).every((f) => !filterValues[f.key] || f.predicate(r, filterValues[f.key]));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, filterValues]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (editing === 'new') await api.create(values as Partial<T>);
      else if (editing) await api.update(getId(editing), values as Partial<T>);
      toast.success(`${singular} ${editing === 'new' ? 'added' : 'updated'} successfully.`);
      setEditing(null);
      reload();
    } catch (e) {
      setServerError(describeError(e).message);
    }
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.remove(getId(deleting));
      toast.success(`${singular} deleted.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(describeError(e).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const view = (r: T) => (props.onView ? props.onView(r) : setViewing(r));
  const handlers: RowHandlers<T> = { edit: setEditing, remove: setDeleting, view };

  const allColumns: Column<T>[] = [
    ...columns,
    {
      key: '__actions',
      header: 'Actions',
      className: 'w-px text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn" aria-label={`View ${singular}`} title="View" onClick={() => view(row)}>
            <Eye size={15} />
          </button>
          {props.rowActions?.(row)}
          <button className="icon-btn" aria-label={`Edit ${singular}`} title="Edit" onClick={() => setEditing(row)}>
            <Pencil size={14} />
          </button>
          <button className="icon-btn hover:!text-danger" aria-label={`Delete ${singular}`} title="Delete" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {props.extraActions}
            <button className="btn-primary" onClick={() => setEditing('new')}>
              <Plus size={14} /> Add {singular}
            </button>
          </>
        }
      />
      <div className="panel">
        <FilterBar>
          <div className="w-full sm:w-64">
            <label className="label">Search</label>
            <SearchInput value={search} onChange={setSearch} placeholder={props.searchPlaceholder ?? `Search ${title.toLowerCase()}…`} />
          </div>
          {props.filters?.map((f) => (
            <SelectFilter
              key={f.key}
              label={f.label}
              value={filterValues[f.key] ?? ''}
              onChange={(v) => setFilterValues((s) => ({ ...s, [f.key]: v }))}
              options={f.options}
            />
          ))}
          {props.alternateView && (
            <div className="ml-auto flex rounded border border-line p-0.5 text-xs">
              {(['table', 'alt'] as const).map((m) => (
                <button
                  key={m}
                  className={`rounded px-2.5 py-1 ${mode === m ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}
                  onClick={() => setMode(m)}
                >
                  {m === 'table' ? 'Table' : props.alternateView!.label}
                </button>
              ))}
            </div>
          )}
        </FilterBar>
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          {mode === 'alt' && props.alternateView ? (
            props.alternateView.render(rows, handlers)
          ) : (
            <DataTable
              columns={allColumns}
              rows={rows}
              rowKey={getId}
              emptyTitle={`No ${title.toLowerCase()} found`}
              emptyHint={data && data.length > 0 ? 'Try adjusting your search or filters.' : `Add the first ${singular.toLowerCase()} to get started.`}
            />
          )}
        </AsyncBoundary>
      </div>

      <Modal
        open={editing !== null}
        title={editing === 'new' ? `Add ${singular}` : `Edit ${singular}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" form="crud-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="crud-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
          {serverError && (
            <div className="rounded border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger sm:col-span-2" role="alert">
              {serverError}
            </div>
          )}
          {fields.map((f) => {
            const err = errors[f.name]?.message as string | undefined;
            return (
              <FormField key={f.name} label={f.label} htmlFor={`f-${f.name}`} error={err}>
                {f.type === 'select' ? (
                  <select id={`f-${f.name}`} className="input" {...register(f.name)}>
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`f-${f.name}`}
                    className="input"
                    type={f.type}
                    placeholder={f.placeholder}
                    {...register(f.name, f.type === 'number' ? { valueAsNumber: true } : undefined)}
                  />
                )}
              </FormField>
            );
          })}
        </form>
      </Modal>

      <Modal open={viewing !== null} title={`${singular} details`} size="md" onClose={() => setViewing(null)}>
        {viewing &&
          (props.renderDetail ? (
            props.renderDetail(viewing)
          ) : (
            <DetailList data={viewing as Record<string, unknown>} />
          ))}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${singular.toLowerCase()}`}
        danger
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        Are you sure you want to delete <strong>{deleting ? props.describeRow(deleting) : ''}</strong>? Records that other data depends on may be
        refused by the server.
      </ConfirmDialog>
    </div>
  );
}

export function DetailList({ data, hide = [] }: { data: Record<string, unknown>; hide?: string[] }) {
  const entries = Object.entries(data).filter(([k, v]) => !hide.includes(k) && v !== null && v !== undefined && typeof v !== 'object');
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="border-b border-line/70 pb-1.5">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{humanize(k)}</dt>
          <dd className="text-[13px]">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
