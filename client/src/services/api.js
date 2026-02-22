const API_BASE = 'http://localhost:3001/api';

// Goal Discussion API
export const goalApi = {
  // Start or continue a goal discussion with AI
  async discuss({ goal, conversationHistory = [], userMessage }) {
    const response = await fetch(`${API_BASE}/goals/discuss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, conversationHistory, userMessage }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to discuss goal');
    }
    return response.json();
  },

  // Extract subgoals from conversation
  async extractSubgoals({ goal, conversationHistory }) {
    const response = await fetch(`${API_BASE}/goals/extract-subgoals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, conversationHistory }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract subgoals');
    }
    return response.json();
  },
};

// Daily Planning API
export const planningApi = {
  // Get AI suggestions for tomorrow's tasks
  async suggest({ goals, existingTasks, userPreferences, conversationHistory = [] }) {
    const response = await fetch(`${API_BASE}/planning/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, existingTasks, userPreferences, conversationHistory }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get suggestions');
    }
    return response.json();
  },

  // Tweak time allocation
  async tweak({ currentPlan, userRequest, conversationHistory = [] }) {
    const response = await fetch(`${API_BASE}/planning/tweak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPlan, userRequest, conversationHistory }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to tweak plan');
    }
    return response.json();
  },

  // Finalize and extract schedule as JSON
  async finalize({ conversationHistory }) {
    const response = await fetch(`${API_BASE}/planning/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationHistory }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to finalize schedule');
    }
    return response.json();
  },
};

// Health check
export const checkHealth = async () => {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
};
