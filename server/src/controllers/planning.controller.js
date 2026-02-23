import { streamChatWithOllama, chatWithOllama } from '../lib/ollama.js';

/**
 * Daily planning suggestion endpoint
 * AI suggests tasks for tomorrow based on goals
 * Supports SSE streaming for real-time responses
 */
export async function suggestPlan(req, res) {
  try {
    const { goals, existingTasks, userPreferences, conversationHistory = [], enableThinking = true } = req.body;

    const goalsContext = (!goals || goals.length === 0)
      ? 'The user has no goals set up yet. Help them think about what they could work on tomorrow and encourage them to set up goals.'
      : goals.map(g => {
        const milestonesStr = g.milestones?.map(m => {
          const checkpoints = m.checklist?.map(c => `    - [${c.done ? 'x' : ' '}] ${c.text}`).join('\n') || '    No checkpoints';
          return `  Milestone: ${m.title}\n${checkpoints}`;
        }).join('\n') || '  No milestones yet';
        return `Goal: ${g.title}\nProgress: ${g.progress || 0}%\n${milestonesStr}`;
      }).join('\n\n');

    const systemPrompt = `You are an AI daily planner assistant. Your ONLY job is to help the user build a schedule for TOMORROW. You are NOT a real-time coach.

Here are the user's current goals and progress:

${goalsContext}

Important rules:
- You are planning what the user will do TOMORROW, not right now
- NEVER tell the user to "go do" something, "start now", or say you'll "wait" for them
- NEVER act as if the user should be executing tasks during this conversation
- This is an advance planning session — the result will be saved and used in a focused timer session tomorrow
- Base your suggestions on the user's goals, milestones, and incomplete checkpoints shown above
- Prioritize incomplete checkpoints that advance milestones closest to completion

When proposing a schedule for tomorrow:
- Break the day into time blocks (e.g. "09:00 - 10:30: Work on X")
- Each task should have a clear title and a brief description of what to do
- Include realistic time estimates and breaks
- Keep the total day realistic (6-10 productive hours)
- Ask clarifying questions about tomorrow's plan (e.g. "What time do you plan to wake up tomorrow?", work hours, priorities) before proposing a full schedule

Keep your responses concise.`;

    const messages = [...conversationHistory];

    if (conversationHistory.length === 0) {
      let userContent = 'Please suggest what I should work on tomorrow, considering my goals and priorities.';
      
      if (userPreferences) {
        userContent += `\n\nMy preferences: ${userPreferences}`;
      }
      
      messages.push({ role: 'user', content: userContent });
    }

    // Use SSE streaming with thinking mode controlled by client
    await streamChatWithOllama(res, messages, systemPrompt, enableThinking);
  } catch (error) {
    console.error('Error in daily planning:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate daily plan', details: error.message });
    }
  }
}

/**
 * Tweak time allocation
 * Supports SSE streaming for real-time responses
 */
export async function tweakPlan(req, res) {
  try {
    const { currentPlan, userRequest, conversationHistory = [], enableThinking = false } = req.body;

    if (!currentPlan || !userRequest) {
      return res.status(400).json({ error: 'Current plan and user request are required' });
    }

    const systemPrompt = `You are an AI daily planner assistant. The user wants to modify their daily schedule.

Current plan:
${JSON.stringify(currentPlan, null, 2)}

Help the user tweak their schedule based on their request. Be flexible and accommodating.
When adjusting time allocations:
- Respect the user's wishes
- Suggest trade-offs if needed (e.g., "If you want to spend more time on X, we could reduce Y")
- Keep the total day realistic (typically 6-10 productive hours)

Provide the updated schedule clearly.`;

    const messages = [
      ...conversationHistory,
      { role: 'user', content: userRequest },
    ];

    // Use SSE streaming with thinking mode controlled by client
    await streamChatWithOllama(res, messages, systemPrompt, enableThinking);
  } catch (error) {
    console.error('Error tweaking plan:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to tweak plan', details: error.message });
    }
  }
}

/**
 * Extract final daily schedule as JSON
 * Uses non-streaming + thinking for accurate JSON extraction
 */
export async function finalizePlan(req, res) {
  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({ error: 'Conversation history is required' });
    }

    const systemPrompt = `Based on the planning conversation, extract the final agreed-upon daily schedule for tomorrow.

Return ONLY a JSON array with the following structure (no other text, no markdown code blocks):
[
  {
    "title": "Task title",
    "description": "Brief actionable description of what to do during this block",
    "startTime": "09:00",
    "endTime": "10:30",
    "estimatedMins": 90
  }
]

Rules:
- "title" is a short task name
- "description" is a 1-2 sentence actionable instruction for the task
- "startTime" and "endTime" are in 24-hour "HH:MM" format
- "estimatedMins" is the duration in minutes as an integer
- Order tasks by startTime
- Include breaks if they were discussed`;

    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: 'Please extract the final daily schedule we agreed upon as a JSON array only, no other text.',
      },
    ];

    // Non-streaming with thinking for accurate extraction
    const content = await chatWithOllama(messages, systemPrompt, true);

    // Try to parse the JSON response
    let schedule;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        schedule = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse schedule:', parseError);
      console.error('Raw response:', content);
      return res.status(500).json({ error: 'Failed to parse schedule from AI response' });
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Error finalizing schedule:', error);
    res.status(500).json({ error: 'Failed to finalize schedule', details: error.message });
  }
}
