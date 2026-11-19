const styles: Record<string, string> = {
  approved: 'bg-success-soft text-success border-success/30',
  active: 'bg-success-soft text-success border-success/30',
  confirmed: 'bg-success-soft text-success border-success/30',
  completed: 'bg-success-soft text-success border-success/30',
  eligible: 'bg-success-soft text-success border-success/30',
  available: 'bg-success-soft text-success border-success/30',
  pending: 'bg-warning-soft text-warning border-warning/30',
  assigned: 'bg-secondary-soft text-secondary border-secondary/30',
  'on leave': 'bg-warning-soft text-warning border-warning/30',
  rejected: 'bg-danger-soft text-danger border-danger/30',
  cancelled: 'bg-danger-soft text-danger border-danger/30',
  inactive: 'bg-gray-100 text-ink-muted border-line',
  ineligible: 'bg-danger-soft text-danger border-danger/30',
  unavailable: 'bg-danger-soft text-danger border-danger/30',
};

export function StatusBadge({ status }: { status?: string }) {
  const label = status || '—';
  const cls = styles[label.toLowerCase()] ?? 'bg-gray-100 text-ink-muted border-line';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${cls}`}>
      {label}
    </span>
  );
}
