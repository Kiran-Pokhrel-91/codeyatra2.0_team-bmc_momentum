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

// Goal Discussion API
export const goalApi = {
  // Start or continue a goal discussion with AI (SSE streaming)
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
    
    // Fallback to JSON response (shouldn't happen with streaming server)
    return response.json();
  },

  // Extract subgoals from conversation (non-streaming JSON)
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
  // Get AI suggestions for tomorrow's tasks (SSE streaming)
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
    
    return response.json();
  },

  // Tweak time allocation (SSE streaming)
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
    
    return response.json();
  },

  // Finalize and extract schedule as JSON (non-streaming)
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
