import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { APP_ICON, NAV_GROUPS } from '../../routes/navigation';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: Props) {
  const Logo = APP_ICON;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-white transition-transform duration-150
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${collapsed ? 'lg:w-[60px]' : 'lg:w-[232px]'} w-[248px]`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-white">
            <Logo size={17} />
          </div>
          <div className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="truncate text-[13px] font-semibold">College Timetable</div>
            <div className="truncate text-[11px] text-ink-muted">Administration Portal</div>
          </div>
          <button className="icon-btn ml-auto lg:hidden" aria-label="Close menu" onClick={onCloseMobile}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.heading} className={gi > 0 ? 'mt-4 border-t border-line pt-3' : ''}>
              <div className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted ${collapsed ? 'lg:hidden' : ''}`}>
                {group.heading}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.path} className="group relative">
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `relative flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors ${
                          isActive ? 'bg-primary-soft font-medium text-primary' : 'text-ink-muted hover:bg-app hover:text-ink'
                        } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute left-0 top-1.5 h-5 w-[3px] rounded-r bg-primary" />}
                          <item.icon size={16} className="shrink-0" />
                          <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                    {collapsed && (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 lg:block"
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-line p-2 lg:block">
          <button
            className={`btn-ghost w-full ${collapsed ? 'px-0' : 'justify-start'}`}
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}
