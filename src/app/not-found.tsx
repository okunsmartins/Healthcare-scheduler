import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-sm font-medium text-primary">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you are looking for does not exist or you may not have access to it.
      </p>
      <Link
        href="/"
        className={buttonVariants({ variant: 'outline', className: 'mt-6' })}
      >
        Return home
      </Link>
    </main>
  );
}
