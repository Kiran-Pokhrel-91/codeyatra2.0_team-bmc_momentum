import { ollama, stripThinking } from '../lib/ollama.js';
import { config } from '../config/index.js';

/**
 * Health check endpoint
 * Tests Ollama connection and returns status
 */
export async function checkHealth(req, res) {
  try {
    const response = await ollama.chat({
      model: config.ollama.model,
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
      model: config.ollama.model, 
      provider: 'Ollama (Local)',
      test: content 
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      model: config.ollama.model, 
      error: error.message 
    });
  }
}
