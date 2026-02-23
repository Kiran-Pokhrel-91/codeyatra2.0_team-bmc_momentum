import { Router } from 'express';
import * as goalsController from '../controllers/goals.controller.js';
import * as milestonesController from '../controllers/milestones.controller.js';

const router = Router();

// AI endpoints (must be before /:id to avoid conflicts)
router.post('/discuss', goalsController.discussGoal);
router.post('/extract-subgoals', goalsController.extractSubgoals);

// CRUD endpoints
router.get('/', goalsController.getAllGoals);
router.post('/', goalsController.createGoal);
router.get('/:id', goalsController.getGoal);
router.put('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);

// Milestones under a goal
router.get('/:goalId/milestones', milestonesController.getMilestones);
router.post('/:goalId/milestones', goalsController.createMilestone);

// AI suggestion
router.post('/:id/ai/suggest-milestones', goalsController.suggestMilestones);

export default router;
