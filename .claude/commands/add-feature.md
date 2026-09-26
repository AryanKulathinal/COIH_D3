# Add a new feature to COIH

When adding a new feature, follow this checklist:

## Backend
1. If it needs Claude AI: add the generator function in `server/src/services/` (follow the pattern in `briefGenerator.js` or `insightsGenerator.js`)
2. Add mock response in `server/src/services/mockResponses.js` or `mockInsights.js` — the app must work without an API key
3. Add API route in `server/src/routes/` — always check `isLiveMode()` and return mock data when no API key
4. Register the route in `server/src/index.js`

## Frontend
1. Add API method in `client/src/services/api.js`
2. Create the page/component in `client/src/pages/` or `client/src/components/`
3. Register in `App.jsx` — add to NAV_ITEMS array and Routes

## Theme Rules
- Use the UST theme from `client/src/index.css` — teal primary (#006e74), white cards, Poppins font
- Use rem values (base 16px): headings 1rem, body 0.75rem, small 0.688rem, tiny 0.625rem
- Cards: use `.card` class. Buttons: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-success`
- Badges: `.badge .badge-{priority}` or `.badge-{status}`
- Use inline styles for component-specific styling

## Claude AI Rules
- Model: `claude-sonnet-5` (from `claudeClient.js`)
- Always use `thinking: { type: "adaptive" }`
- Always use `CACHED_SYSTEM` for the system prompt (prompt caching)
- Track token usage with `trackUsage(response)`
- All answers must be grounded — cite sourceId, never hallucinate
- Calibrated refusal when evidence is insufficient

## Testing
1. Restart server: `pkill -f "node src/index.js" && cd server && node src/index.js &`
2. Build check: `cd client && npx vite build` (must pass with 0 errors)
3. Test the API endpoint with curl
4. Verify the UI at http://localhost:5173

User request: $ARGUMENTS
