import { cn } from '@/lib/utils/cn';

/**
 * Inline form-level alert. Errors use `role="alert"` (assertive); success/info use
 * `role="status"`. Colour is paired with the role + text, never the sole signal.
 */
export function FormAlert({
  tone,
  children,
}: {
  tone: 'error' | 'success';
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-critical/30 bg-critical/10 text-critical'
          : 'border-safe/30 bg-safe/10 text-safe',
      )}
    >
      {children}
    </div>
  );
}
