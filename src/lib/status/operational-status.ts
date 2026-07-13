/**
 * Operational status vocabulary shared across the portal (dashboards, badges,
 * roster cells, rule violations).
 *
 * Accessibility rule (WCAG 2.2 — do not rely on colour alone): every status maps
 * to BOTH a colour token and a distinct text label + icon name. UI components must
 * render the label/icon, not just the colour.
 */

export type OperationalStatus =
  | 'critical'
  | 'warning'
  | 'safe'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'draft'
  | 'changed'
  | 'suspended'
  | 'archived';

export interface StatusPresentation {
  /** Human-readable label; never rely on colour alone to convey this. */
  readonly label: string;
  /** Tailwind colour token group defined in tailwind.config.ts / globals.css. */
  readonly tone: 'critical' | 'warning' | 'safe' | 'muted' | 'primary';
  /** lucide-react icon name, so the status is distinguishable without colour. */
  readonly icon: string;
  /** Relative severity for sorting; higher is more urgent. */
  readonly severity: number;
}

const PRESENTATION: Record<OperationalStatus, StatusPresentation> = {
  critical: { label: 'Critical', tone: 'critical', icon: 'octagon-alert', severity: 100 },
  warning: { label: 'Warning', tone: 'warning', icon: 'triangle-alert', severity: 80 },
  changed: { label: 'Changed', tone: 'warning', icon: 'history', severity: 60 },
  pending: { label: 'Pending', tone: 'muted', icon: 'clock', severity: 50 },
  rejected: { label: 'Rejected', tone: 'critical', icon: 'circle-x', severity: 40 },
  suspended: { label: 'Suspended', tone: 'warning', icon: 'pause', severity: 40 },
  draft: { label: 'Draft', tone: 'muted', icon: 'pencil', severity: 30 },
  archived: { label: 'Archived', tone: 'muted', icon: 'archive', severity: 20 },
  approved: { label: 'Approved', tone: 'safe', icon: 'circle-check', severity: 15 },
  published: { label: 'Published', tone: 'safe', icon: 'send', severity: 10 },
  safe: { label: 'Safe', tone: 'safe', icon: 'shield-check', severity: 0 },
};

/** Resolve the presentation metadata for a status. */
export function getStatusPresentation(status: OperationalStatus): StatusPresentation {
  return PRESENTATION[status];
}

/**
 * Sort statuses most-urgent first. Used by dashboards so operational attention
 * lands on the highest-severity items (e.g. understaffed departments) first.
 */
export function sortBySeverity<T>(
  items: readonly T[],
  getStatus: (item: T) => OperationalStatus,
): T[] {
  return [...items].sort(
    (a, b) => PRESENTATION[getStatus(b)].severity - PRESENTATION[getStatus(a)].severity,
  );
}
