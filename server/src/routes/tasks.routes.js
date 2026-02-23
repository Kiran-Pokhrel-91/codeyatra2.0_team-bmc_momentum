import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller.js';

const router = Router();

// Get all pending tasks (for daily planning)
router.get('/pending', tasksController.getAllPendingTasks);

// CRUD endpoints
router.get('/:id', tasksController.getTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

// Toggle task status
router.patch('/:id/status', tasksController.toggleTaskStatus);

// Reorder tasks
router.patch('/reorder', tasksController.reorderTasks);

export default router;
