import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { EmptyState } from './States';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyHint?: string;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, pageSize = 10, emptyTitle = 'No records found', emptyHint }: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return dir === 'asc' ? r : -r;
    });
  }, [rows, columns, sortKey, dir]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  useEffect(() => setPage(1), [rows.length]);

  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggle = (key: string) => {
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setDir('asc');
    }
  };

  if (rows.length === 0) return <EmptyState title={emptyTitle} hint={emptyHint} />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="border-b border-line bg-app/70">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`th ${c.className ?? ''}`}
                  aria-sort={sortKey === c.key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortValue ? (
                    <button className="inline-flex items-center gap-1 uppercase hover:text-ink" onClick={() => toggle(c.key)}>
                      {c.header}
                      {sortKey === c.key ? (
                        dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ChevronsUpDown size={11} className="opacity-50" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-app/60' : 'hover:bg-app/40'}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`td ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-ink-muted">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="icon-btn" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="px-1">
              Page {page} / {pages}
            </span>
            <button className="icon-btn" aria-label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
