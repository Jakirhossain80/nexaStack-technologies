import { Router } from 'express';

import * as healthController from '../controllers/health.controller.js';

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Process liveness
 *     description: Returns 200 while the process is running. Checks no dependencies.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Process is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, enum: [ok] }
 *                     uptimeSeconds: { type: integer }
 */
healthRouter.get('/', healthController.getHealth);

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness
 *     description: Returns 200 when the MongoDB connection is open and answers a ping.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Ready to serve traffic
 *       503:
 *         description: Not ready (database unavailable). Error envelope, code SERVICE_UNAVAILABLE.
 */
healthRouter.get('/ready', healthController.getReady);
