import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-ink-muted" role="status">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center" role="alert">
      <AlertTriangle size={20} className="text-danger" />
      <p className="max-w-md text-[13px] text-ink">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-1" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
      <Inbox size={20} className="text-ink-muted" />
      <p className="text-[13px] font-medium">{title}</p>
      {hint && <p className="max-w-sm text-xs text-ink-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Convenience wrapper that picks the right state. */
export function AsyncBoundary({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return <>{children}</>;
}
