export interface StatCardProps {
  label: string;
  value: number | string;
}

/**
 * `<dt>`/`<dd>` pairing — unambiguous to assistive technology regardless of visual
 * position, per the dashboard task's accessibility requirement. Renders the real value
 * directly; no count-up animation (an internal tool showing small, honest numbers doesn't
 * need a "big reveal").
 */
export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-card border border-default bg-surface p-5 shadow-card">
      <dt className="text-label text-secondary">{label}</dt>
      <dd className="mt-2 text-section font-semibold text-primary">{value}</dd>
    </div>
  );
}
