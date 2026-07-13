import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short label used where horizontal space is tight (mobile bottom nav). */
  shortLabel?: string;
}

/**
 * Primary navigation for the authenticated workspace shell.
 *
 * Kept intentionally small (four destinations) so it maps cleanly onto the mobile
 * bottom nav. Destinations are placeholders until their feature branches land; see
 * docs/IMPLEMENTATION_PLAN.md.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Roster', href: '/roster', icon: CalendarDays },
  { label: 'People', href: '/people', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

/**
 * True when `pathname` is within the section rooted at `href` — an exact match or a
 * descendant route (`/roster` is active on `/roster/2026-07`). Avoids matching
 * unrelated routes that merely share a string prefix (`/peoplehr`).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
