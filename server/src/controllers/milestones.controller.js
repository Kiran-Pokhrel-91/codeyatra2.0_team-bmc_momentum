import { streamChatWithOllama, chatWithOllama } from '../lib/ollama.js';
import prisma from '../lib/prisma.js';

// ============================================================
// CRUD ENDPOINTS
// ============================================================

/**
 * Get all milestones for a goal
 */
export async function getMilestones(req, res) {
  try {
    const { goalId } = req.params;

    // Check if goal exists
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const milestones = await prisma.milestone.findMany({
      where: { goalId },
      orderBy: { orderIndex: 'asc' },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Calculate progress for each milestone
    const milestonesWithProgress = milestones.map(milestone => {
      const totalTasks = milestone.tasks.length;
      const completedTasks = milestone.tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      return {
        ...milestone,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks
      };
    });

    res.json(milestonesWithProgress);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones', details: error.message });
  }
}

/**
 * Get a single milestone by ID
 */
export async function getMilestone(req, res) {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        goal: true,
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Calculate progress
    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(t => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    res.json({
      ...milestone,
      progress,
      taskCount: totalTasks,
      completedTaskCount: completedTasks
    });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ error: 'Failed to fetch milestone', details: error.message });
  }
}

/**
 * Update a milestone
 */
export async function updateMilestone(req, res) {
  try {
    const { id } = req.params;
    const { title, description, targetDate, status, orderIndex } = req.body;

    // Check if milestone exists
    const existingMilestone = await prisma.milestone.findUnique({ where: { id } });
    if (!existingMilestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (status !== undefined) updateData.status = status;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData
    });

    res.json(milestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone', details: error.message });
  }
}

/**
 * Delete a milestone (cascades to tasks)
 */
export async function deleteMilestone(req, res) {
  try {
    const { id } = req.params;

    // Check if milestone exists
    const existingMilestone = await prisma.milestone.findUnique({ where: { id } });
    if (!existingMilestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    await prisma.milestone.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone', details: error.message });
  }
}

/**
 * Reorder milestones within a goal
 */
export async function reorderMilestones(req, res) {
  try {
    const { milestoneIds } = req.body;

    if (!milestoneIds || !Array.isArray(milestoneIds)) {
      return res.status(400).json({ error: 'milestoneIds array is required' });
    }

    // Update order index for each milestone
    const updates = milestoneIds.map((id, index) => 
      prisma.milestone.update({
        where: { id },
        data: { orderIndex: index }
      })
    );

    await prisma.$transaction(updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering milestones:', error);
    res.status(500).json({ error: 'Failed to reorder milestones', details: error.message });
  }
}

/**
 * Create a task under a milestone
 */
export async function createTask(req, res) {
  try {
    const { milestoneId } = req.params;
    const { title, description, estimatedMins, dueDate, priority } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if milestone exists
    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Get the next order index
    const lastTask = await prisma.task.findFirst({
      where: { milestoneId },
      orderBy: { orderIndex: 'desc' }
    });
    const orderIndex = lastTask ? lastTask.orderIndex + 1 : 0;

    const task = await prisma.task.create({
      data: {
        milestoneId,
        title: title.trim(),
        description: description?.trim() || null,
        estimatedMins: estimatedMins || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        orderIndex
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
}

// ============================================================
// AI ENDPOINTS
// ============================================================

/**
 * AI suggest tasks for a milestone
 * Uses SSE streaming for real-time responses
 */
export async function suggestTasks(req, res) {
  try {
    const { id } = req.params;
    const { enableThinking = true } = req.body;

    // Fetch the milestone with its goal
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { 
        goal: true,
        tasks: true 
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const existingTasks = milestone.tasks.map(t => t.title).join(', ') || 'None yet';

    const systemPrompt = `You are an AI assistant helping to break down a milestone into actionable tasks.
A task should be a specific, actionable item that can be completed in a single work session (1-4 hours).

Goal: "${milestone.goal.title}"
Milestone: "${milestone.title}"
${milestone.description ? `Milestone description: ${milestone.description}` : ''}
${milestone.targetDate ? `Target date: ${milestone.targetDate.toISOString().split('T')[0]}` : ''}
Existing tasks: ${existingTasks}

Suggest 3-6 tasks that would help complete this milestone.
For each task, provide:
- A clear, actionable title (start with a verb)
- A brief description
- Estimated time in minutes (e.g., 30, 60, 90, 120)
- Priority (HIGH, MEDIUM, or LOW)

Format your response clearly with each task numbered.`;

    const messages = [
      { role: 'user', content: 'Please suggest tasks for my milestone.' }
    ];

    await streamChatWithOllama(res, messages, systemPrompt, enableThinking);
  } catch (error) {
    console.error('Error suggesting tasks:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to suggest tasks', details: error.message });
    }
  }
}
