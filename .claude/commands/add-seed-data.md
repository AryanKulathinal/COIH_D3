# Add more seed data to the demo

Add synthetic records to `data/<account>/<type>.json` (accounts: `alpha` = Helix Retail, `beta` = Meridian Freight).

## Context
- Alpha: Priya Sharma back from leave Apr 1–14 2025 (today Apr 15); Vikram Patel new joiner Apr 21.
- Beta: Meera Iyer, live incident INC-7310 (FastShip 429s). Its fix must stay OUT of the source files — it only exists in `data/accounts.json → demo.resolutionPrefill` so the capture loop is meaningful.
- Personas, suggested questions and checklists live in `data/accounts.json`.

## Rules
1. Every record: `sourceType`, `sourceId` (unique within the account), `account` (must match the folder), ISO `timestamp`, `body`
2. Add `component` when the record concerns a service — it drives incident context and the ownership map
3. `mentionsUser` / `requiresAction` are relative to the account's main persona
4. Knowledge entries (`knowledge.json`) use: `id` (KB-A-xxx / KB-B-xxx), `title`, `category`, `symptom`, `rootCause`, `resolution`, `prevention`, `components`, `tags`, `evidence[]`, `status: "confirmed"`, `capturedFrom`, `capturedBy`, `confirmedBy`, `capturedAt`
5. Synthetic data only — no real client or personal data
6. Validate JSON (`node -e "JSON.parse(require('fs').readFileSync('<file>'))"`), then smoke-test with `node -e 'import("./lib/store.js").then(s=>console.log(s.getStats({account:"alpha"})))'`
7. If a storyline changes, re-record fallbacks: `npm run record`
8. Commit the data change on its own

## Source types
`email`, `chat`, `ticket`, `incident`, `document`, `meeting`, `calendar` — one JSON array file per type.

User request: $ARGUMENTS
