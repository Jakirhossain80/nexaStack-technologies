import { Router } from 'express';

import { contactRouter } from './contact.routes.js';
import { healthRouter } from './health.routes.js';

const v1Router = Router();
v1Router.use('/contact', contactRouter);

export const router = Router();
router.use('/health', healthRouter);
router.use('/api/v1', v1Router);
