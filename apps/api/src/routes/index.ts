import { Router } from 'express';

import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { contactRouter } from './contact.routes.js';
import { healthRouter } from './health.routes.js';

const v1Router = Router();
v1Router.use('/contact', contactRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/admin', adminRouter);

export const router = Router();
router.use('/health', healthRouter);
router.use('/api/v1', v1Router);
