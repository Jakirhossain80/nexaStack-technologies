import { Router } from 'express';

import { adminRouter } from './admin.routes.js';
import { adminBlogRouter } from './adminBlog.routes.js';
import { adminEnquiriesRouter } from './adminEnquiries.routes.js';
import { adminMediaRouter } from './adminMedia.routes.js';
import { adminQuotationsRouter } from './adminQuotations.routes.js';
import { authRouter } from './auth.routes.js';
import { contactRouter } from './contact.routes.js';
import { healthRouter } from './health.routes.js';

const v1Router = Router();
v1Router.use('/contact', contactRouter);
v1Router.use('/auth', authRouter);
// Blog is mounted BEFORE the general admin router: that router's blanket role gate excludes
// `content_editor`, and must not run first for /admin/blog. See adminBlog.routes.ts.
v1Router.use('/admin/blog', adminBlogRouter);
// Enquiry management has its own router (with its own role gate) for the same reason it sits
// before `adminRouter`: its routes are matched here and never fall through to the general router.
v1Router.use('/admin/enquiries', adminEnquiriesRouter);
// Quotation management: same reasoning. It replaces the minimal quotation routes that used to live
// in `adminRouter`.
v1Router.use('/admin/quotations', adminQuotationsRouter);
// Media Library: same reasoning, and its upload routes carry multipart bodies the general router's
// JSON-only handling was never meant for.
v1Router.use('/admin/media', adminMediaRouter);
v1Router.use('/admin', adminRouter);

export const router = Router();
router.use('/health', healthRouter);
router.use('/api/v1', v1Router);
