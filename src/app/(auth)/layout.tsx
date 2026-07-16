import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/shell/theme-toggle';

/**
 * Layout for the signed-out authentication pages: a slim header (brand + theme toggle)
 * over a centered content column. Middleware bounces already-authenticated users away
 * from these routes.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CalendarCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold">Healthcare Scheduler</span>
        </Link>
        <ThemeToggle />
      </header>

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12"
      >
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
