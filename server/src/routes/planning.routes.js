import { Router } from 'express';
import * as planningController from '../controllers/planning.controller.js';

const router = Router();

// AI planning endpoints (existing)
router.post('/suggest', planningController.suggestPlan);
router.post('/tweak', planningController.tweakPlan);
router.post('/finalize', planningController.finalizePlan);

export default router;
