import { Search } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        className="input pl-8"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
