# Setup the COIH project from scratch

Run the full local setup for COIH (Vercel functions + Vite client, no database):

1. Install dependencies: `npm run install:all` (root: Anthropic SDK, MiniSearch, dev Express; client: React/Vite)
2. Check for `.env.local` at the repo root. If missing, copy `.env.example` and tell the user to add `ANTHROPIC_API_KEY` (never with a `VITE_` prefix).
3. Start both servers: `npm run dev` (API on :3001 via `scripts/dev-api.js`, web on :5173 proxying `/api`)
4. Verify: `curl -s http://localhost:3001/api/health` → `claudeConfigured` should be `true` when the key is set
5. Open http://localhost:5173, pick a persona and walk one flow
6. Report the URLs and whether Claude is configured. Without a key the app serves recorded fallbacks where they exist and a clear 503 otherwise.

User request: $ARGUMENTS
