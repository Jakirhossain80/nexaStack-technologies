export interface LoadErrorProps {
  /** What could not be loaded, for the heading: "the blog posts". */
  subject: string;
  status: number | null;
  message: string;
}

/** Shown when an admin page's data could not be read. Says what to do, not just what failed. */
export function LoadError({ subject, status, message }: LoadErrorProps) {
  const hint =
    status === 403
      ? 'Your account does not have permission to view this.'
      : status === 401
        ? 'Your session may have expired. Sign in again.'
        : 'Reload the page to try again. If it keeps happening, check that the API is running.';

  return (
    <div role="alert" className="mt-8 rounded-card border border-error bg-surface p-5">
      <h2 className="text-card font-semibold text-error">Could not load {subject}</h2>
      <p className="mt-2 text-body text-primary">{message}</p>
      <p className="mt-1 text-body text-secondary">{hint}</p>
    </div>
  );
}
