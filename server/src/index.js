import app from './app.js';
import { config } from './config/index.js';

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Using Ollama (Local) with model: ${config.ollama.model}`);
  console.log(`Ollama URL: ${config.ollama.url}`);
});
