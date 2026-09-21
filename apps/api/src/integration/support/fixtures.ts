import { randomBytes, randomUUID } from 'node:crypto';

import type { ContentStatus } from '@nexastack/shared';

import type { Api } from './harness.js';

/**
 * Obviously synthetic records for the integration tests (Test User, test@example.com, example.com).
 * They exist only in the throwaway `_test` database the harness creates, never in a development or
 * production database.
 */

export async function seedEnquiry(api: Api, overrides: Record<string, unknown> = {}) {
  return api.models.ContactSubmission.create({
    fullName: 'Test User',
    email: 'test@example.com',
    subject: 'Test enquiry',
    message: 'This is a synthetic test message.',
    preferredContactMethod: 'email',
    consent: true,
    ...overrides,
  });
}

export async function seedQuotation(api: Api, overrides: Record<string, unknown> = {}) {
  return api.models.QuotationSubmission.create({
    referenceNumber: `NXQ-${randomBytes(4).toString('hex').toUpperCase()}`,
    fullName: 'Test User',
    email: 'test@example.com',
    telephone: '+880 1000-000000',
    country: 'Bangladesh',
    projectType: 'new-website',
    requiredServices: ['business-websites'],
    businessObjectives: 'A synthetic objective for a test run.',
    targetUsers: 'Test customers',
    projectStatus: 'new',
    requiredFeatures: 'A synthetic feature list for a test run.',
    numberOfPages: '1-5',
    designRequirements: 'need-full-design',
    needsAdminDashboard: false,
    needsAuthentication: false,
    budgetRange: 'small',
    preferredStartDate: '2026-11-01',
    maintenanceRequired: 'no',
    consent: true,
    ...overrides,
  });
}

/** A valid body for `POST /admin/blog/posts` (and `PATCH /posts/:id`). */
export function postBody(categoryId: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `Test post ${randomUUID().slice(0, 8)}`,
    excerpt: 'A synthetic excerpt that is long enough to pass.',
    categoryId,
    tags: ['test'],
    contentMarkdown: 'A synthetic body that is long enough to pass validation.',
    featured: false,
    ...overrides,
  };
}

export interface SeedPostOverrides {
  status?: ContentStatus;
  title?: string;
  slug?: string;
  featured?: boolean;
  publishedAt?: Date | null;
}

/** Writes a post straight into the database (as the API would have), in any status. */
export async function seedPost(
  api: Api,
  categoryId: string,
  authorId: string,
  overrides: SeedPostOverrides = {},
) {
  const suffix = randomUUID().slice(0, 8);
  const status = overrides.status ?? 'draft';
  return api.models.BlogPost.create({
    title: `Test post ${suffix}`,
    slug: `test-post-${suffix}`,
    excerpt: 'A synthetic excerpt that is long enough to pass.',
    category: categoryId,
    tags: ['test'],
    contentMarkdown: 'A synthetic body that is long enough to pass validation.',
    contentHtml: '<p>A synthetic body that is long enough to pass validation.</p>',
    featured: false,
    publishedAt: status === 'published' || status === 'unpublished' ? new Date() : null,
    createdBy: authorId,
    updatedBy: authorId,
    ...overrides,
    status,
  });
}

export async function seedMedia(
  api: Api,
  uploaderId: string,
  overrides: Record<string, unknown> = {},
) {
  const suffix = randomUUID().slice(0, 8);
  return api.models.Media.create({
    filename: `test-${suffix}.png`,
    mediaType: 'image',
    cloudinaryPublicId: `test/${suffix}`,
    url: `https://res.cloudinary.com/test-cloud/image/upload/test/${suffix}.png`,
    mimeType: 'image/png',
    sizeBytes: 100,
    altText: 'A synthetic test image',
    uploadedByAdminId: uploaderId,
    ...overrides,
  });
}

/** Everything the RBAC tests must prove was NOT changed by a refused request, as one comparable string. */
export async function snapshot(api: Api): Promise<string> {
  const { AdminUser, BlogPost, BlogCategory, ContactSubmission, QuotationSubmission, Media } =
    api.models;
  const [users, posts, categories, enquiries, quotations, media] = await Promise.all([
    AdminUser.find().sort({ email: 1 }).select('email role status').lean(),
    BlogPost.find().sort({ slug: 1 }).select('slug status title featured').lean(),
    BlogCategory.find().sort({ slug: 1 }).select('slug name').lean(),
    ContactSubmission.find().sort({ _id: 1 }).select('status archived notes').lean(),
    QuotationSubmission.find().sort({ _id: 1 }).select('status archived notes').lean(),
    Media.find().sort({ _id: 1 }).select('filename altText').lean(),
  ]);
  return JSON.stringify({ users, posts, categories, enquiries, quotations, media });
}
