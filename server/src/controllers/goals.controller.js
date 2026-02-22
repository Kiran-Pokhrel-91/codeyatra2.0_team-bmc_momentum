import { streamChatWithOllama, chatWithOllama } from '../lib/ollama.js';

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

// ============================================================
// CRUD endpoints (to be implemented in Phase 1 with Prisma)
// ============================================================

/**
 * Get all goals
 */
export async function getAllGoals(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * Create a new goal
 */
export async function createGoal(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * Get a single goal by ID with milestones and tasks
 */
export async function getGoal(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * Update a goal
 */
export async function updateGoal(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * Delete a goal
 */
export async function deleteGoal(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * Create a milestone under a goal
 */
export async function createMilestone(req, res) {
  // TODO: Implement with Prisma in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}

/**
 * AI suggest milestones for a goal
 */
export async function suggestMilestones(req, res) {
  // TODO: Implement in Phase 1
  res.status(501).json({ error: 'Not implemented yet' });
}
