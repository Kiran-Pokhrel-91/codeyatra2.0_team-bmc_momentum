import { Router } from 'express';
import healthRoutes from './health.routes.js';
import goalsRoutes from './goals.routes.js';
import planningRoutes from './planning.routes.js';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/goals', goalsRoutes);
router.use('/planning', planningRoutes);

export default router;
