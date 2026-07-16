import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input styled to the design system. Height meets the 44px touch-target minimum and
 * focus is always visible. `aria-invalid` inputs get a critical-toned ring.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-critical aria-[invalid=true]:focus-visible:ring-critical',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
