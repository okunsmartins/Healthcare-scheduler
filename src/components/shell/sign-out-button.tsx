import { LogOut } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';
import { cn } from '@/lib/utils/cn';

/**
 * Signs the user out via a server action (a real form submit, so it works without JS).
 * `showLabel={false}` renders an icon-only control for tight spaces (mobile top bar).
 */
export function SignOutButton({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label={showLabel ? undefined : 'Sign out'}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-muted-foreground',
          'transition-colors hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          !showLabel && 'w-11 justify-center px-0',
          className,
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        {showLabel ? 'Sign out' : null}
      </button>
    </form>
  );
}
