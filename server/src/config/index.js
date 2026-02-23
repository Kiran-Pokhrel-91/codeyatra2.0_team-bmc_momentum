import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  ollama: {
    url: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'qwen3:4b',
  },
  // Database URL will be added in Phase 1
  // databaseUrl: process.env.DATABASE_URL,
};
