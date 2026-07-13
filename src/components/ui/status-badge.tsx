import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import {
  getStatusPresentation,
  type OperationalStatus,
} from '@/lib/status/operational-status';

const TONE_CLASSES: Record<string, string> = {
  critical: 'bg-critical/10 text-critical border-critical/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  safe: 'bg-safe/10 text-safe border-safe/30',
  primary: 'bg-primary/10 text-primary border-primary/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export interface StatusBadgeProps {
  status: OperationalStatus;
  className?: string;
}

/**
 * Renders an operational status as a bordered pill with an always-present text
 * label. Colour is supplementary, never the sole signal (WCAG 2.2). The status
 * name is also exposed to assistive tech via `aria-label`.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, tone } = getStatusPresentation(status);
  return (
    <span
      aria-label={`Status: ${label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
