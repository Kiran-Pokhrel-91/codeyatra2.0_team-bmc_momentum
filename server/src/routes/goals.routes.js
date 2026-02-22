import { Router } from 'express';
import * as goalsController from '../controllers/goals.controller.js';

const router = Router();

// CRUD endpoints (Phase 1)
router.get('/', goalsController.getAllGoals);
router.post('/', goalsController.createGoal);
router.get('/:id', goalsController.getGoal);
router.put('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);

// Milestones under a goal (Phase 1)
router.post('/:goalId/milestones', goalsController.createMilestone);

// AI endpoints (existing)
router.post('/discuss', goalsController.discussGoal);
router.post('/extract-subgoals', goalsController.extractSubgoals);

// AI suggestion (Phase 1)
router.post('/:id/ai/suggest-milestones', goalsController.suggestMilestones);

export default router;
