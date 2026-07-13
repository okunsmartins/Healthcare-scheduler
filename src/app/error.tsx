'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary. Shows an explicit, non-technical message instead of
 * a blank screen. The raw error is logged for diagnostics but never rendered to the
 * user (it may contain sensitive detail). A support code aids triage.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured error reporting is wired to the Sentry-compatible abstraction later.
    console.error('Unhandled route error', { digest: error.digest });
  }, [error]);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-sm font-medium text-critical">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        We could not complete that request
      </h1>
      <p className="mt-3 text-muted-foreground">
        An unexpected error occurred. You can try again, and if it keeps happening please
        contact support with the reference below.
      </p>
      {error.digest ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
