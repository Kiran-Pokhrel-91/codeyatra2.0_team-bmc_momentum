import { streamChatWithOllama, chatWithOllama } from '../lib/ollama.js';
import prisma from '../lib/prisma.js';

// ============================================================
// AI ENDPOINTS
// ============================================================

/**
 * Goal discussion endpoint - AI discusses a goal with the user and suggests subgoals
 * Supports SSE streaming for real-time responses
 */
export async function discussGoal(req, res) {
  try {
    const { goal, conversationHistory = [], userMessage, enableThinking = true } = req.body;

    if (!goal && !userMessage) {
      return res.status(400).json({ error: 'Goal or user message is required' });
    }

    const systemPrompt = `You are a supportive AI goal coach helping users break down their goals into achievable subgoals. 

Your approach:
1. Be encouraging and user-centric - always consider the user's feedback and preferences
2. Ask clarifying questions to understand the goal better (timeline, resources, constraints)
3. Suggest 3-5 specific, actionable subgoals based on the conversation
4. Each subgoal should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
5. Be concise but helpful - avoid overwhelming the user
6. If the user provides feedback or modifications, incorporate them thoughtfully

Format your subgoal suggestions clearly when providing them:
- Start each subgoal with a bullet point
- Include estimated time/effort when relevant
- Group related subgoals if needed`;

    const messages = [...conversationHistory];

    // If this is the first message about a new goal
    if (goal && conversationHistory.length === 0) {
      messages.push({
        role: 'user',
        content: `I want to achieve this goal: "${goal}". Can you help me break it down into manageable subgoals? First, ask me any clarifying questions you need.`,
      });
    } else if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    // Use SSE streaming with thinking mode controlled by client
    await streamChatWithOllama(res, messages, systemPrompt, enableThinking);
  } catch (error) {
    console.error('Error in goal discussion:', error);
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process goal discussion', details: error.message });
    }
  }
}

/**
 * Extract subgoals from conversation
 * Uses non-streaming + thinking mode for accurate JSON extraction
 */
export async function extractSubgoals(req, res) {
  try {
    const { goal, conversationHistory } = req.body;

    if (!goal || !conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({ error: 'Goal and conversation history are required' });
    }

    const systemPrompt = `Based on the conversation about the user's goal, extract the final agreed-upon subgoals.

Return ONLY a JSON array with the following structure (no other text, no markdown code blocks):
[
  {
    "title": "Subgoal title",
    "description": "Brief description",
    "estimatedDays": 7,
    "priority": "high" | "medium" | "low"
  }
]

Consider the user's feedback and preferences from the conversation when finalizing the subgoals.`;

    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: `Please extract the final subgoals we discussed for my goal: "${goal}". Return them as a JSON array only, no other text.`,
      },
    ];

    // Non-streaming with thinking for accurate extraction
    const content = await chatWithOllama(messages, systemPrompt, true);

    // Try to parse the JSON response
    let subgoals;
    try {
      // Extract JSON from the response (in case there's extra text or markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        subgoals = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse subgoals:', parseError);
      console.error('Raw response:', content);
      return res.status(500).json({ error: 'Failed to parse subgoals from AI response' });
    }

    res.json({ subgoals });
  } catch (error) {
    console.error('Error extracting subgoals:', error);
    res.status(500).json({ error: 'Failed to extract subgoals', details: error.message });
  }
}

/**
 * AI suggest milestones for a goal
 * Uses SSE streaming for real-time responses
 */
export async function suggestMilestones(req, res) {
  try {
    const { id } = req.params;
    const { enableThinking = true } = req.body;

    // Fetch the goal from database
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { milestones: true }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const existingMilestones = goal.milestones.map(m => m.title).join(', ') || 'None yet';

    const systemPrompt = `You are an AI assistant helping to break down a goal into milestones.
A milestone is a major checkpoint or phase in achieving the goal.
Each milestone should represent a significant, measurable achievement.

The user's goal: "${goal.title}"
${goal.description ? `Description: ${goal.description}` : ''}
${goal.targetDate ? `Target date: ${goal.targetDate.toISOString().split('T')[0]}` : ''}
Existing milestones: ${existingMilestones}

Suggest 3-5 milestones that would help achieve this goal.
For each milestone, provide:
- A clear title
- A brief description
- An estimated target date (if the goal has a target date)
- Order/sequence in which they should be completed

Format your response clearly with each milestone numbered.`;

    const messages = [
      { role: 'user', content: 'Please suggest milestones for my goal.' }
    ];

    await streamChatWithOllama(res, messages, systemPrompt, enableThinking);
  } catch (error) {
    console.error('Error suggesting milestones:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to suggest milestones', details: error.message });
    }
  }
}

// ============================================================
// CRUD ENDPOINTS
// ============================================================

/**
 * Get all goals with milestone count and progress
 */
export async function getAllGoals(req, res) {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        milestones: {
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const totalMilestones = goal.milestones.length;
      const completedMilestones = goal.milestones.filter(m => m.status === 'COMPLETED').length;
      const progress = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0;

      return {
        ...goal,
        progress,
        milestoneCount: totalMilestones,
        completedMilestoneCount: completedMilestones
      };
    });

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals', details: error.message });
  }
}

/**
 * Create a new goal
 */
export async function createGoal(req, res) {
  try {
    const { title, description, targetDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: targetDate ? new Date(targetDate) : null
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal', details: error.message });
  }
}

/**
 * Get a single goal by ID with milestones and tasks
 */
export async function getGoal(req, res) {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Calculate progress
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.status === 'COMPLETED').length;
    const progress = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100) 
      : 0;

    // Calculate milestone progress
    const milestonesWithProgress = goal.milestones.map(milestone => {
      const totalTasks = milestone.tasks.length;
      const completedTasks = milestone.tasks.filter(t => t.status === 'COMPLETED').length;
      const milestoneProgress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      return {
        ...milestone,
        progress: milestoneProgress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks
      };
    });

    res.json({
      ...goal,
      milestones: milestonesWithProgress,
      progress,
      milestoneCount: totalMilestones,
      completedMilestoneCount: completedMilestones
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal', details: error.message });
  }
}

/**
 * Update a goal
 */
export async function updateGoal(req, res) {
  try {
    const { id } = req.params;
    const { title, description, targetDate, status } = req.body;

    // Check if goal exists
    const existingGoal = await prisma.goal.findUnique({ where: { id } });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (status !== undefined) updateData.status = status;

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData
    });

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal', details: error.message });
  }
}

/**
 * Delete a goal (cascades to milestones and tasks)
 */
export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;

    // Check if goal exists
    const existingGoal = await prisma.goal.findUnique({ where: { id } });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal', details: error.message });
  }
}

/**
 * Create a milestone under a goal
 */
export async function createMilestone(req, res) {
  try {
    const { goalId } = req.params;
    const { title, description, targetDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if goal exists
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Get the next order index
    const lastMilestone = await prisma.milestone.findFirst({
      where: { goalId },
      orderBy: { orderIndex: 'desc' }
    });
    const orderIndex = lastMilestone ? lastMilestone.orderIndex + 1 : 0;

    const milestone = await prisma.milestone.create({
      data: {
        goalId,
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        orderIndex
      }
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone', details: error.message });
  }
}
