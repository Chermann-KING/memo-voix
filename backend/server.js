// This file is the entry point for the backend server
// It loads environment variables and starts the Hono server

// Load environment variables from .env file
require('dotenv').config();

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: OPENAI_API_KEY is not set in .env file');
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Please create a .env file in the root directory with your OpenAI API key:');
  console.log('\x1b[36m%s\x1b[0m', 'OPENAI_API_KEY=your_openai_api_key_here');
  process.exit(1);
}

console.log('\x1b[32m%s\x1b[0m', '✅ OpenAI API key found in environment variables');

// Import and start the Hono server
const { serve } = require('@hono/node-server');
const { default: app } = require('./hono');

const port = process.env.PORT || 3000;

console.log(`\x1b[34m%s\x1b[0m`, `🚀 Starting backend server on port ${port}...`);
console.log(`\x1b[34m%s\x1b[0m`, `📡 API will be available at http://localhost:${port}/api/trpc`);

serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log('\x1b[32m%s\x1b[0m', `✅ Backend server is running on port ${port}`);