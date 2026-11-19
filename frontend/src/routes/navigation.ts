import {
  Archive,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Library,
  ScrollText,
  School,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}
export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { heading: 'Overview', items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }] },
  {
    heading: 'Academic Management',
    items: [
      { label: 'Departments', path: '/departments', icon: Building2 },
      { label: 'Teachers', path: '/teachers', icon: Users },
      { label: 'Courses', path: '/courses', icon: Library },
      { label: 'Classrooms', path: '/classrooms', icon: School },
      { label: 'Time Slots', path: '/time-slots', icon: CalendarClock },
    ],
  },
  {
    heading: 'Scheduling',
    items: [
      { label: 'Timetable', path: '/timetable', icon: CalendarDays },
      { label: 'Teacher Availability', path: '/availability', icon: UserCheck },
      { label: 'Timetable Generator', path: '/generator', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'Leave & Substitutions',
    items: [
      { label: 'Leave Management', path: '/leaves', icon: ClipboardList },
      { label: 'Substitution Management', path: '/substitutions', icon: UserCog },
    ],
  },
  {
    heading: 'Records',
    items: [
      { label: 'Reports', path: '/reports', icon: FileBarChart },
      { label: 'Audit Logs', path: '/audit', icon: ScrollText },
      { label: 'Archive', path: '/archive', icon: Archive },
    ],
  },
];

export const APP_ICON = GraduationCap;

export function titleForPath(pathname: string): string[] {
  if (pathname === '/') return ['Dashboard'];
  for (const g of NAV_GROUPS) {
    for (const i of g.items) {
      if (i.path !== '/' && pathname.startsWith(i.path)) {
        const rest = pathname.slice(i.path.length).split('/').filter(Boolean);
        return rest.length ? [i.label, 'Details'] : [i.label];
      }
    }
  }
  return ['Page'];
}
