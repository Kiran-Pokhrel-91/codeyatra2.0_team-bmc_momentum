import prisma from '../lib/prisma.js';

// ============================================================
// CRUD ENDPOINTS
// ============================================================

/**
 * Get all tasks for a milestone
 */
export async function getTasks(req, res) {
  try {
    const { milestoneId } = req.params;

    // Check if milestone exists
    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { milestoneId },
      orderBy: { orderIndex: 'asc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(req, res) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        milestone: {
          include: { goal: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task', details: error.message });
  }
}

/**
 * Update a task
 */
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, estimatedMins, dueDate, priority, status, orderIndex } = req.body;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (estimatedMins !== undefined) updateData.estimatedMins = estimatedMins;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
}

/**
 * Toggle task status (PENDING -> IN_PROGRESS -> COMPLETED -> PENDING)
 */
export async function toggleTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If status is provided, use it; otherwise cycle through statuses
    let newStatus = status;
    if (!newStatus) {
      const statusOrder = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
      const currentIndex = statusOrder.indexOf(existingTask.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      newStatus = statusOrder[nextIndex];
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status: newStatus }
    });

    // Check if milestone should be updated
    // If all tasks are completed, update milestone status
    const milestone = await prisma.milestone.findUnique({
      where: { id: existingTask.milestoneId },
      include: { tasks: true }
    });

    if (milestone) {
      const allCompleted = milestone.tasks.every(t => 
        t.id === id ? newStatus === 'COMPLETED' : t.status === 'COMPLETED'
      );
      const anyInProgress = milestone.tasks.some(t => 
        t.id === id ? newStatus === 'IN_PROGRESS' : t.status === 'IN_PROGRESS'
      );

      let milestoneStatus = 'PENDING';
      if (allCompleted) {
        milestoneStatus = 'COMPLETED';
      } else if (anyInProgress || newStatus === 'IN_PROGRESS') {
        milestoneStatus = 'IN_PROGRESS';
      }

      if (milestone.status !== milestoneStatus) {
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: milestoneStatus }
        });
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Error toggling task status:', error);
    res.status(500).json({ error: 'Failed to toggle task status', details: error.message });
  }
}

/**
 * Delete a task
 */
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
}

/**
 * Reorder tasks within a milestone
 */
export async function reorderTasks(req, res) {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    // Update order index for each task
    const updates = taskIds.map((id, index) => 
      prisma.task.update({
        where: { id },
        data: { orderIndex: index }
      })
    );

    await prisma.$transaction(updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks', details: error.message });
  }
}

/**
 * Get all pending tasks across all goals/milestones
 * Useful for daily planning
 */
export async function getAllPendingTasks(req, res) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        milestone: {
          include: { goal: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks', details: error.message });
  }
}
