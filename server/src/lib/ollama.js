import { Ollama } from 'ollama';
import { config } from '../config/index.js';

// Create Ollama client instance
export const ollama = new Ollama({ host: config.ollama.url });

/**
 * Strip thinking tags from qwen3 responses
 * @param {string} text - Raw response text
 * @returns {string} - Text with thinking tags removed
 */
export function stripThinking(text) {
  if (!text) return '';
  // Remove everything before and including </think> tag
  const thinkEndTag = '</think>';
  const idx = text.indexOf(thinkEndTag);
  if (idx !== -1) {
    return text.slice(idx + thinkEndTag.length).trim();
  }
  return text;
}

/**
 * Chat with Ollama (non-streaming, for JSON extraction)
 * @param {Array} messages - Conversation messages
 * @param {string} systemPrompt - System prompt
 * @param {boolean} enableThinking - Whether to enable thinking mode
 * @returns {Promise<string>} - Response content
 */
export async function chatWithOllama(messages, systemPrompt = '', enableThinking = false) {
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
    model: config.ollama.model,
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

/**
 * Stream chat responses via SSE
 * @param {Response} res - Express response object
 * @param {Array} messages - Conversation messages
 * @param {string} systemPrompt - System prompt
 * @param {boolean} enableThinking - Whether to enable thinking mode
 * @returns {Promise<string>} - Full response content
 */
export async function streamChatWithOllama(res, messages, systemPrompt = '', enableThinking = false) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const ollamaMessages = [];

  // Add system prompt if provided
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

  let fullContent = '';
  let isInsideThinking = false;
  let thinkingComplete = false;

  try {
    const stream = await ollama.chat({
      model: config.ollama.model,
      messages: ollamaMessages,
      stream: true
    });

    for await (const chunk of stream) {
      const text = chunk.message?.content || '';
      
      if (!text) continue;
      
      // Handle thinking tags - buffer content until </think> is found
      if (!thinkingComplete) {
        fullContent += text;
        
        // Check if we're inside or starting a thinking block
        if (fullContent.includes('<think>') || isInsideThinking) {
          isInsideThinking = true;
          
          // Check if thinking is complete
          if (fullContent.includes('</think>')) {
            thinkingComplete = true;
            // Extract content after </think>
            const afterThink = fullContent.split('</think>')[1] || '';
            if (afterThink.trim()) {
              res.write(`data: ${JSON.stringify({ text: afterThink.trim(), done: false })}\n\n`);
            }
            fullContent = afterThink;
          }
          // Still inside thinking, don't send anything yet
          continue;
        }
        
        // No thinking tags, send text directly
        thinkingComplete = true;
        res.write(`data: ${JSON.stringify({ text: fullContent, done: false })}\n\n`);
        continue;
      }
      
      // Normal streaming after thinking is complete
      fullContent += text;
      res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ text: '', done: true, fullContent: stripThinking(fullContent) })}\n\n`);
    res.end();
    
    return stripThinking(fullContent);
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
    throw error;
  }
}
