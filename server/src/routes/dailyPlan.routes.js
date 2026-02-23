import { Router } from 'express';
import * as dailyPlanController from '../controllers/dailyPlan.controller.js';

const router = Router();

router.get('/upcoming', dailyPlanController.getUpcomingPlans);
router.get('/:date', dailyPlanController.getDailyPlan);
router.post('/', dailyPlanController.createOrUpdateDailyPlan);

export default router;
