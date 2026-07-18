import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  /** Path segment under the tenant, e.g. 'dashboard' → /[tenantSlug]/dashboard. */
  segment: string;
  icon: LucideIcon;
  /** Short label used where horizontal space is tight (mobile bottom nav). */
  shortLabel?: string;
}

/**
 * Primary navigation for the authenticated workspace shell. Destinations are tenant-scoped:
 * hrefs are built from the active `tenantSlug` (see {@link navHref}). Kept to four so it maps
 * cleanly onto the mobile bottom nav.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', segment: 'dashboard', icon: LayoutDashboard },
  { label: 'Roster', segment: 'roster', icon: CalendarDays },
  { label: 'People', segment: 'people', icon: Users },
  { label: 'Settings', segment: 'settings', icon: Settings },
];

/** Build a tenant-scoped href, e.g. navHref('st-marys', 'roster') → '/st-marys/roster'. */
export function navHref(tenantSlug: string, segment: string): string {
  return `/${tenantSlug}/${segment}`;
}

/**
 * True when `pathname` is within the tenant-scoped section for `segment` — an exact match or a
 * descendant route (`/st-marys/roster` is active on `/st-marys/roster/2026-07`). Avoids
 * matching unrelated routes that merely share a string prefix.
 */
export function isNavItemActive(
  pathname: string,
  tenantSlug: string,
  segment: string,
): boolean {
  const href = navHref(tenantSlug, segment);
  return pathname === href || pathname.startsWith(`${href}/`);
}
