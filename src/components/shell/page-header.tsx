/** Consistent page title + supporting description for workspace pages. */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Placeholder body for a destination whose feature branch has not landed yet. Names the
 * branch so the shell doubles as living documentation of what is coming.
 */
export function ComingSoon({ branch }: { branch: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-card-foreground">
      <p className="text-sm font-medium">This area is part of the workspace shell.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Its functionality arrives on <code className="text-foreground">{branch}</code>.
        For now it demonstrates navigation, responsive layout, and theming.
      </p>
    </div>
  );
}
