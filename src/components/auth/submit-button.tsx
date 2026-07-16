'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';

/**
 * Submit button that reflects the enclosing form's pending state: disabled and showing a
 * busy label while the server action runs. Reads `useFormStatus`, so it must be rendered
 * inside the `<form>` it submits.
 */
export function SubmitButton({
  children,
  pendingLabel = 'Please wait…',
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending || undefined} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
