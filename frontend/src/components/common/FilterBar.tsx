import type { ReactNode } from 'react';

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-2 border-b border-line px-3 py-3">{children}</div>;
}

export interface Option {
  value: string;
  label: string;
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  className = 'w-40',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-36">
      <label className="label">{label}</label>
      <input type="date" className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </div>
  );
}
