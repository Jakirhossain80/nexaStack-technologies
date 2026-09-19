import type { Metadata } from 'next';

import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { AttentionList } from '@/components/admin/AttentionList';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/Button';
import {
  getDashboardStats,
  getEnquiriesNeedingAttention,
  getQuotationsNeedingAttention,
  getRecentActivity,
} from '@/lib/adminDashboard.server';
import { can, getAdminSession } from '@/lib/adminSession.server';
import { getAllPosts } from '@/lib/blog';
import { projects } from '@/config/projects';
import { services } from '@/config/services';
import { solutions } from '@/config/solutions';
import { fullTechnologyCategories } from '@/config/technologies';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

const ATTENTION_LIMIT = 5;
const ACTIVITY_LIMIT = 5;

/**
 * Everyone signed in sees the site-content counts. The enquiry and quotation cards and lists need
 * `manage:enquiries` / `manage:quotations`, the recent-activity feed needs `audit:view`, and each quick
 * action follows the capability of the page it links to. A section an admin cannot use is left out, not
 * shown as "Not available", and the API is not asked for data it would refuse (it refuses regardless).
 */
export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  const canEnquiries = can(admin, 'manage:enquiries');
  const canQuotations = can(admin, 'manage:quotations');
  const canAudit = can(admin, 'audit:view');

  // Static/stubbed content: real config array lengths, computed here directly — no API
  // round-trip, since these already live in apps/web (root CLAUDE.md dashboard task, section 2).
  const servicesCount = services.length;
  const solutionsCount = solutions.length;
  const projectsCount = projects.length;
  // The full 10-category set (`/technologies`'s own page), not just the homepage's
  // 6-category teaser subset — more representative of the site's real technology content.
  const technologyCategoriesCount = fullTechnologyCategories.length;
  // Published posts only (that is what `lib/blog.ts` serves); read from MongoDB, and degrades to
  // "Not available" like the API-backed stats below if the database is unreachable.
  const blogPostsCount = await getAllPosts()
    .then((posts) => posts.length)
    .catch(() => 'Not available' as const);

  // Dynamic, MongoDB-backed content — fetched from apps/api.
  const [stats, newEnquiries, newQuotations, activity] = await Promise.all([
    canEnquiries || canQuotations ? getDashboardStats() : null,
    canEnquiries ? getEnquiriesNeedingAttention(ATTENTION_LIMIT) : [],
    canQuotations ? getQuotationsNeedingAttention(ATTENTION_LIMIT) : [],
    canAudit ? getRecentActivity(ACTIVITY_LIMIT) : [],
  ]);

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Dashboard</h1>
      <p className="mt-2 text-body text-secondary">
        A real snapshot of the site&apos;s content and recent admin activity.
      </p>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total services" value={servicesCount} />
        <StatCard label="Total solutions" value={solutionsCount} />
        <StatCard label="Total projects" value={projectsCount} />
        <StatCard label="Technology categories" value={technologyCategoriesCount} />
        <StatCard label="Published blog posts" value={blogPostsCount} />
        {canEnquiries && (
          <StatCard
            label="New contact enquiries"
            value={stats?.contact ? stats.contact.new : 'Not available'}
          />
        )}
        {canQuotations && (
          <StatCard
            label="New quotation requests"
            value={stats?.quotation ? stats.quotation.new : 'Not available'}
          />
        )}
      </dl>

      {(canEnquiries || canQuotations) && (
        <section className="mt-10">
          <h2 className="text-card font-semibold text-primary">Content requiring attention</h2>
          <p className="mt-1 text-label text-secondary">
            The most recent unaddressed enquiries and quotation requests.
          </p>
          <div className="mt-4">
            <AttentionList enquiries={newEnquiries} quotations={newQuotations} />
          </div>
        </section>
      )}

      {canAudit && (
        <section className="mt-10">
          <h2 className="text-card font-semibold text-primary">Recent administrative activity</h2>
          <p className="mt-1 text-label text-secondary">
            The most recent sign-in and password-reset events.
          </p>
          <div className="mt-4">
            <ActivityFeed entries={activity} />
          </div>
        </section>
      )}

      {(canEnquiries || canQuotations) && (
        <section className="mt-10">
          <h2 className="text-card font-semibold text-primary">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {canEnquiries && (
              <Button href="/admin/enquiries?status=new" variant="secondary">
                View new enquiries
              </Button>
            )}
            {canQuotations && (
              <Button href="/admin/quotations?status=new" variant="secondary">
                View new quotation requests
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
