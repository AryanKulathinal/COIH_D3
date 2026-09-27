# Add a new feature to COIH

## Backend (Vercel function)
1. Claude logic goes in `lib/agents/<feature>.js`. Reuse `runToolLoop`, `parseJson` and `CACHED_SYSTEM` from `lib/claude.js`; read data only through `lib/store.js` (always pass `account`).
2. Create `api/<feature>.js` exporting `apiHandler(async (body, req, res) => …)` from `lib/guard.js` — it enforces POST, the account whitelist and rate limiting. Validate inputs with `requireString`.
3. Wrap the Claude call in `withFallback(account, fallbackKey("<feature>", …), fn)` and add the path to `scripts/record-fallbacks.js`.

## Frontend
1. Add the call to `client/src/services/api.js`
2. Page in `client/src/pages/`, register in `App.jsx` (`NAV_ITEMS` + `Routes`); use `useSession()` for persona/account and `markStep()` for checklist items
3. Render citations with `SourceChip` / `CitedText` from `components/SourceDrawer.jsx`, and costs with `components/RunMeta.jsx`

## Rules
- Model `claude-sonnet-5`, `thinking: { type: "adaptive" }`, cached system prompt — all handled by `runToolLoop`
- Grounded or silent: cite sourceIds / KB ids; refuse and name the gap when evidence is missing
- Account-scoped: never read across `data/<account>` folders
- UST theme (`client/src/index.css`), rem sizes, inline styles for component-specific styling
- One feature per commit

## Testing
`cd client && npx vite build` must pass; exercise the endpoint with curl via `npm run dev:api`; walk the UI flow.

User request: $ARGUMENTS
