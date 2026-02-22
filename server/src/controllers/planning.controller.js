import { streamChatWithOllama, chatWithOllama } from '../lib/ollama.js';

/**
 * Daily planning suggestion endpoint
 * AI suggests tasks for tomorrow based on goals
 * Supports SSE streaming for real-time responses
 */
export async function suggestPlan(req, res) {
  try {
    const { goals, existingTasks, userPreferences, conversationHistory = [], enableThinking = true } = req.body;

    if (!goals || goals.length === 0) {
      return res.status(400).json({ error: 'Goals are required for planning' });
    }

    const systemPrompt = `You are an AI daily planner that helps users plan their tomorrow based on their goals and priorities.

Your approach:
1. Analyze the user's goals and their subgoals/tasks
2. Consider importance, urgency, and deadlines
3. Suggest a realistic daily schedule (typically 4-8 tasks)
4. Account for energy levels (harder tasks in the morning when energy is typically higher)
5. Include breaks and buffer time
6. Be flexible - the user can modify the suggestions

When suggesting tasks, consider:
- High priority items that are approaching deadlines
- Tasks that unblock other work
- A mix of quick wins and deeper work
- The user's stated preferences and constraints

Format your suggestions clearly with estimated time for each task.`;

    const goalsContext = goals.map(g => {
      const tasksStr = g.tasks?.map(t => `  - ${t.title} (${t.done ? 'done' : 'pending'})`).join('\n') || '  No tasks yet';
      return `Goal: ${g.title}\nProgress: ${g.progress || 0}%\nTasks:\n${tasksStr}`;
    }).join('\n\n');

    const messages = [...conversationHistory];

    if (conversationHistory.length === 0) {
      let userContent = `Here are my current goals and tasks:\n\n${goalsContext}\n\n`;
      
      if (userPreferences) {
        userContent += `My preferences: ${userPreferences}\n\n`;
      }
      
      userContent += 'Please suggest what I should work on tomorrow, considering importance and priority. Start by asking any clarifying questions if needed.';
      
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

    const systemPrompt = `Based on the planning conversation, extract the final agreed-upon daily schedule.

Return ONLY a JSON array with the following structure (no other text, no markdown code blocks):
[
  {
    "time": "09:00",
    "duration": "90m",
    "title": "Task title",
    "goalId": "optional - which goal this relates to",
    "priority": "high" | "medium" | "low"
  }
]

Order tasks by time. Include breaks if they were discussed.`;

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
