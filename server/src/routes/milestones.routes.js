import { Router } from 'express';
import * as milestonesController from '../controllers/milestones.controller.js';

const router = Router();

// CRUD endpoints
router.get('/:id', milestonesController.getMilestone);
router.put('/:id', milestonesController.updateMilestone);
router.delete('/:id', milestonesController.deleteMilestone);

// Reorder milestones
router.patch('/reorder', milestonesController.reorderMilestones);

// Tasks under a milestone
router.post('/:milestoneId/tasks', milestonesController.createTask);

// AI suggestion
router.post('/:id/ai/suggest-tasks', milestonesController.suggestTasks);

export default router;
