const API_BASE = 'http://localhost:3001/api';

// Helper function to handle SSE streaming responses
async function handleSSEStream(response, onChunk, onComplete, onError) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE events (lines ending with \n\n)
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        try {
          const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
          
          if (data.error) {
            onError?.(new Error(data.error));
            return;
          }
          
          if (data.text) {
            fullContent += data.text;
            onChunk?.(data.text, fullContent);
          }
          
          if (data.done) {
            onComplete?.(data.fullContent || fullContent);
            return;
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE data:', line, parseError);
        }
      }
    }
    
    // Stream ended without explicit done signal
    onComplete?.(fullContent);
  } catch (error) {
    onError?.(error);
  }
}

// Goal API - CRUD and AI endpoints
export const goalApi = {
  // ============================================================
  // CRUD ENDPOINTS
  // ============================================================

  /**
   * Get all goals with milestone count and progress
   */
  async getAllGoals() {
    const response = await fetch(`${API_BASE}/goals`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch goals');
    }
    return response.json();
  },

  /**
   * Create a new goal
   */
  async createGoal({ title, description, targetDate }) {
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, targetDate }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create goal');
    }
    return response.json();
  },

  /**
   * Get a single goal with milestones and tasks
   */
  async getGoal(id) {
    const response = await fetch(`${API_BASE}/goals/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch goal');
    }
    return response.json();
  },

  /**
   * Update a goal
   */
  async updateGoal(id, data) {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update goal');
    }
    return response.json();
  },

  /**
   * Delete a goal
   */
  async deleteGoal(id) {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete goal');
    }
  },

  // ============================================================
  // MILESTONE ENDPOINTS
  // ============================================================

  /**
   * Get milestones for a goal
   */
  async getMilestones(goalId) {
    const response = await fetch(`${API_BASE}/goals/${goalId}/milestones`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch milestones');
    }
    return response.json();
  },

  /**
   * Create a milestone under a goal
   */
  async createMilestone(goalId, { title, description, targetDate }) {
    const response = await fetch(`${API_BASE}/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, targetDate }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create milestone');
    }
    return response.json();
  },

  /**
   * Update a milestone
   */
  async updateMilestone(id, data) {
    const response = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update milestone');
    }
    return response.json();
  },

  /**
   * Delete a milestone
   */
  async deleteMilestone(id) {
    const response = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete milestone');
    }
  },

  // ============================================================
  // TASK ENDPOINTS
  // ============================================================

  /**
   * Create a task under a milestone
   */
  async createTask(milestoneId, { title, description, estimatedMins, dueDate, priority }) {
    const response = await fetch(`${API_BASE}/milestones/${milestoneId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, estimatedMins, dueDate, priority }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }
    return response.json();
  },

  /**
   * Update a task
   */
  async updateTask(id, data) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }
    return response.json();
  },

  /**
   * Toggle task status
   */
  async toggleTaskStatus(id, status) {
    const response = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle task status');
    }
    return response.json();
  },

  /**
   * Delete a task
   */
  async deleteTask(id) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }
  },

  /**
   * Get all pending tasks (for daily planning)
   */
  async getPendingTasks() {
    const response = await fetch(`${API_BASE}/tasks/pending`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch pending tasks');
    }
    return response.json();
  },

  // ============================================================
  // AI ENDPOINTS
  // ============================================================

  /**
   * Start or continue a goal discussion with AI (SSE streaming)
   */
  async discuss({ goal, conversationHistory = [], userMessage, enableThinking = true }, onChunk) {
    const response = await fetch(`${API_BASE}/goals/discuss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, conversationHistory, userMessage, enableThinking }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to discuss goal');
    }
    
    // If onChunk callback provided, handle as SSE stream
    if (onChunk) {
      return new Promise((resolve, reject) => {
        handleSSEStream(
          response,
          onChunk,
          (fullContent) => resolve({ message: fullContent, role: 'assistant' }),
          reject
        );
      });
    }
    
    // Fallback to JSON response
    return response.json();
  },

  /**
   * Extract subgoals from conversation (non-streaming JSON)
   */
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

  /**
   * AI suggest milestones for a goal (SSE streaming)
   */
  async suggestMilestones(goalId, { enableThinking = true } = {}, onChunk) {
    const response = await fetch(`${API_BASE}/goals/${goalId}/ai/suggest-milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enableThinking }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to suggest milestones');
    }
    
    if (onChunk) {
      return new Promise((resolve, reject) => {
        handleSSEStream(
          response,
          onChunk,
          (fullContent) => resolve({ message: fullContent, role: 'assistant' }),
          reject
        );
      });
    }
    
    return response.json();
  },

  /**
   * AI suggest tasks for a milestone (SSE streaming)
   */
  async suggestTasks(milestoneId, { enableThinking = true } = {}, onChunk) {
    const response = await fetch(`${API_BASE}/milestones/${milestoneId}/ai/suggest-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enableThinking }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to suggest tasks');
    }
    
    if (onChunk) {
      return new Promise((resolve, reject) => {
        handleSSEStream(
          response,
          onChunk,
          (fullContent) => resolve({ message: fullContent, role: 'assistant' }),
          reject
        );
      });
    }
    
    return response.json();
  },
};

// Daily Planning API
export const planningApi = {
  /**
   * Get AI suggestions for tomorrow's tasks (SSE streaming)
   */
  async suggest({ goals, existingTasks, userPreferences, conversationHistory = [], enableThinking = true }, onChunk) {
    const response = await fetch(`${API_BASE}/planning/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, existingTasks, userPreferences, conversationHistory, enableThinking }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get suggestions');
    }
    
    if (onChunk) {
      return new Promise((resolve, reject) => {
        handleSSEStream(
          response,
          onChunk,
          (fullContent) => resolve({ message: fullContent, role: 'assistant' }),
          reject
        );
      });
    }
    
    return response.json();
  },

  /**
   * Tweak time allocation (SSE streaming)
   */
  async tweak({ currentPlan, userRequest, conversationHistory = [], enableThinking = false }, onChunk) {
    const response = await fetch(`${API_BASE}/planning/tweak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPlan, userRequest, conversationHistory, enableThinking }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to tweak plan');
    }
    
    if (onChunk) {
      return new Promise((resolve, reject) => {
        handleSSEStream(
          response,
          onChunk,
          (fullContent) => resolve({ message: fullContent, role: 'assistant' }),
          reject
        );
      });
    }
    
    return response.json();
  },

  /**
   * Finalize and extract schedule as JSON (non-streaming)
   */
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
