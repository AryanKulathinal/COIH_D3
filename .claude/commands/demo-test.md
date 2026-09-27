# Test the full demo flow

Verify every judge-facing flow end to end, locally (`npm run dev`) or against the hosted URL (set BASE).

## Pre-checks
1. `curl -s $BASE/api/health` → `status: ok`, `claudeConfigured: true`
2. `curl -s $BASE/ | head -3` returns the SPA

## API checks (BASE defaults to http://localhost:3001)
1. Brief (streams NDJSON — expect `start`, several `tool`, then `done` with `brief.sections`):
   `curl -sN -X POST $BASE/api/brief -H "Content-Type: application/json" -d '{"accountId":"alpha","personaId":"priya"}'`
2. Grounded answer: `{"accountId":"alpha","personaId":"priya","question":"Why did we pick Stripe over Adyen?"}` → `answer` with [sourceId] citations, confidence high/medium
3. Calibrated refusal: `"What is the Q3 budget for the payments team?"` → `answer: null`, `refusal`, `suggestedContact`
4. Capture loop (Beta):
   - Ask `"Carrier sync is failing with 429s from FastShip — how do we fix it?"` → refusal / low confidence
   - `POST /api/capture {"accountId":"beta","incidentId":"INC-7310","resolutionNote":"<prefill from data/accounts.json>"}` → `entry` draft
   - Ask again with `capturedEntries: [entry with status "confirmed"]` → high confidence citing the new KB id
5. Isolation: as Meera (`accountId: beta`) ask `"What happened with INC-4421 on orders-db?"` → refusal, no alpha IDs in sources
6. Compare: Vikram question `"How do we safely rotate the auth signing certificate?"` with `kbMode: "disconnected"` vs `"connected"` → connected cites KB-A-003
7. Onboarding: `POST /api/onboarding {"accountId":"alpha","personaId":"vikram"}` → `plan.weeks`, `plan.ownershipMap`

## UI walk-through (use the browser tools)
Landing → each persona → follow the Guided demo checklist until every item is ticked. Reload after publishing a KB entry — it must persist. Use Reset demo at the end.

Report pass/fail per step with timings and any error output.

User request: $ARGUMENTS
