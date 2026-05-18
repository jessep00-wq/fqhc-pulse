import { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
}

/**
 * Standard page header for /dashboard and /admin pages.
 * H1 + optional sub line on the left, action cluster on the right.
 */
export function PageHeader({ title, description, primaryAction, secondaryActions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[26px]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground md:text-[15px]">{description}</p>
        )}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
