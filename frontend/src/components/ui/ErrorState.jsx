import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * Error-flavored sibling of EmptyState. Visually distinct from emptiness
 * (solid border + danger-tinted icon) so a failed fetch is never mistaken
 * for a genuinely empty list.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = "Retry",
  className,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border bg-surface/50 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/12 text-danger">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-6">
          <RotateCw className="h-4 w-4" aria-hidden="true" /> {retryLabel}
        </Button>
      )}
    </div>
  );
}
