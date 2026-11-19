import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Menu, Search, UserCircle2 } from 'lucide-react';
import { titleForPath } from '../../routes/navigation';
import { useFetch } from '../../hooks/useFetch';
import { leavesApi } from '../../api/leaves.api';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const crumbs = titleForPath(pathname);
  const pending = useFetch((s) => leavesApi.list({ status: 'Pending' }, s), []);
  const pendingCount = pending.data?.filter((l) => l.status.toLowerCase() === 'pending').length ?? 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/teachers?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white px-4">
      <button className="icon-btn lg:hidden" aria-label="Open menu" onClick={onOpenMenu}>
        <Menu size={18} />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        <span className="hidden text-ink-muted sm:inline">College Timetable</span>
        <ChevronRight size={13} className="hidden text-ink-muted sm:inline" />
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="text-ink-muted" />}
            <span className={i === crumbs.length - 1 ? 'truncate font-medium' : 'text-ink-muted'}>{c}</span>
          </span>
        ))}
      </nav>

      <form onSubmit={submit} className="ml-auto hidden w-60 md:block" role="search">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-8" placeholder="Find a teacher…" aria-label="Find a teacher" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <span className="mr-2 hidden text-xs text-ink-muted xl:inline">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <Link
          to="/leaves?status=Pending"
          className="icon-btn relative"
          aria-label={pendingCount ? `${pendingCount} pending leave requests` : 'No pending leave requests'}
          title="Pending leave requests"
        >
          <Bell size={17} />
          {pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </Link>
        <div className="ml-1 flex items-center gap-2 border-l border-line pl-3">
          <UserCircle2 size={24} className="text-secondary" />
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-medium">Administrator</div>
            <div className="text-[11px] text-ink-muted">Timetable Office</div>
          </div>
        </div>
      </div>
    </header>
  );
}
