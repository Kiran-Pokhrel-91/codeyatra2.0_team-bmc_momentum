import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Ollama } from 'ollama';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b';

const ollama = new Ollama({ host: OLLAMA_URL });

console.log(`Using Ollama model: ${MODEL} at ${OLLAMA_URL}`);

// Helper function to strip thinking tags from qwen3 responses
function stripThinking(text) {
  if (!text) return '';
  // Remove everything before and including </think> tag
  const thinkEndTag = '</think>';
  const idx = text.indexOf(thinkEndTag);
  if (idx !== -1) {
    return text.slice(idx + thinkEndTag.length).trim();
  }
  return text;
}

// Helper function to chat with Ollama (non-streaming, for JSON extraction)
async function chatWithOllama(messages, systemPrompt = '', enableThinking = false) {
  const ollamaMessages = [];

  // Add system prompt if provided
  // For qwen3 models, add /no_think to disable thinking when not needed
  let finalSystemPrompt = systemPrompt;
  if (!enableThinking && systemPrompt) {
    finalSystemPrompt = systemPrompt + '\n\n/no_think';
  }

  if (finalSystemPrompt) {
    ollamaMessages.push({ role: 'system', content: finalSystemPrompt });
  }

  // Convert messages to Ollama format
  for (const msg of messages) {
    ollamaMessages.push({
      role: msg.role,
      content: msg.content
    });
  }

  const response = await ollama.chat({
    model: MODEL,
    messages: ollamaMessages,
    stream: false
  });

  // Strip thinking from response if present
  let content = response.message.content;
  if (!enableThinking) {
    content = stripThinking(content);
  }

  return content;
}

// Helper function to stream chat with Ollama via SSE
async function streamChatWithOllama(res, messages, systemPrompt = '', enableThinking = false) {
  const ollamaMessages = [];

  // Add system prompt if provided
  // For qwen3 models, add /no_think to disable thinking when not needed
  let finalSystemPrompt = systemPrompt;
  if (!enableThinking && systemPrompt) {
    finalSystemPrompt = systemPrompt + '\n\n/no_think';
  }

  if (finalSystemPrompt) {
    ollamaMessages.push({ role: 'system', content: finalSystemPrompt });
  }

  // Convert messages to Ollama format
  for (const msg of messages) {
    ollamaMessages.push({
      role: msg.role,
      content: msg.content
    });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullContent = '';
  let isInThinking = false;
  let thinkBuffer = '';

  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: ollamaMessages,
      stream: true
    });

    for await (const part of response) {
      let chunk = part.message.content;
      
      // Handle thinking mode - only stream actual content, not thinking
      if (!enableThinking) {
        // Buffer content until we're past any thinking tags
        thinkBuffer += chunk;
        const thinkEndTag = '</think>';
        const idx = thinkBuffer.indexOf(thinkEndTag);
        if (idx !== -1) {
          // Found end of thinking, start streaming from here
          chunk = thinkBuffer.slice(idx + thinkEndTag.length);
          thinkBuffer = '';
          isInThinking = false;
        } else if (thinkBuffer.length < 1000) {
          // Still potentially in thinking phase, buffer more
          continue;
        } else {
          // No thinking tag found, probably not a thinking response
          chunk = thinkBuffer;
          thinkBuffer = '';
        }
      }
      
      if (chunk) {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }
    }

    // Flush any remaining buffer
    if (thinkBuffer) {
      const stripped = stripThinking(thinkBuffer);
      if (stripped) {
        fullContent += stripped;
        res.write(`data: ${JSON.stringify({ chunk: stripped, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullContent: fullContent.trim(), role: 'assistant' })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond briefly. /no_think' },
        { role: 'user', content: 'Say "OK" if you are working.' }
      ],
      stream: false
    });
    
    let content = response.message.content;
    // Strip any thinking tags
    content = stripThinking(content);
    
    res.json({ 
      status: 'ok', 
      model: MODEL, 
      provider: 'Ollama (Local)',
      test: content 
    });
  } catch (error) {
    res.json({ status: 'error', model: MODEL, error: error.message });
  }
});

// Goal Discussion endpoint - AI discusses a goal with the user and suggests subgoals
// Uses SSE streaming + thinking mode for better reasoning
app.post('/api/goals/discuss', async (req, res) => {
  try {
    const { goal, conversationHistory = [], userMessage } = req.body;

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

    // Stream response with thinking enabled for better reasoning
    await streamChatWithOllama(res, messages, systemPrompt, true);
  } catch (error) {
    console.error('Error in goal discussion:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process goal discussion', details: error.message });
    }
  }
});

// Extract subgoals from conversation
// Uses non-streaming + thinking mode for accurate JSON extraction
app.post('/api/goals/extract-subgoals', async (req, res) => {
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
});

// Daily Planning endpoint - AI suggests tasks for tomorrow
// Uses SSE streaming + thinking mode for complex scheduling
app.post('/api/planning/suggest', async (req, res) => {
  try {
    const { goals, existingTasks, userPreferences, conversationHistory = [] } = req.body;

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

    // Stream response with thinking enabled for complex planning
    await streamChatWithOllama(res, messages, systemPrompt, true);
  } catch (error) {
    console.error('Error in daily planning:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate daily plan', details: error.message });
    }
  }
});

// Tweak time allocation
// Uses SSE streaming, no thinking (simple modifications)
app.post('/api/planning/tweak', async (req, res) => {
  try {
    const { currentPlan, userRequest, conversationHistory = [] } = req.body;

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

    // Stream response, no thinking needed for simple tweaks
    await streamChatWithOllama(res, messages, systemPrompt, false);
  } catch (error) {
    console.error('Error tweaking plan:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to tweak plan', details: error.message });
    }
  }
});

// Extract final daily schedule as JSON
// Uses non-streaming + thinking for accurate JSON extraction
app.post('/api/planning/finalize', async (req, res) => {
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
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using Ollama (Local) with model: ${MODEL}`);
});
