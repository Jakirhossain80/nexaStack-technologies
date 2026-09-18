import type { ReactNode } from 'react';

export interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Centered, minimal single-column card for the admin login/forgot-password/reset-password
 * pages — a utility surface, not a marketing page (root CLAUDE.md admin auth brief, section
 * 7): no gradient, no bento, no decorative motion. Standard focus/hover/validation
 * transitions only, inherited from the form fields/buttons themselves.
 */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center page-container">
      <div className="w-full max-w-sm rounded-card border border-default bg-surface p-8 shadow-card">
        <h1 className="text-card font-semibold tracking-tight text-primary">{title}</h1>
        {description && <p className="mt-2 text-body text-secondary">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
