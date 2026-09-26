# Test the full demo flow

Run through all 4 demo scenarios and verify they work end-to-end.

## Pre-checks
1. Verify MongoDB is running: `pgrep mongod`
2. Verify server is running: `curl -s http://localhost:3001/health`
3. Verify client is running: `curl -s http://localhost:5173 | head -3`
4. Check mode: `curl -s http://localhost:3001/api/mode`

If any service is down, start it. If data is missing, re-seed: `cd server && node src/seed.js`

## Demo 1: Return-from-Leave Brief
```bash
curl -s -X POST http://localhost:3001/api/brief/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"priya.sharma","userName":"Priya Sharma","leaveStart":"2025-04-01","leaveEnd":"2025-04-14"}'
```
Verify: response has `overview`, `sections` (decisions, workItems, openQuestions, incidents, blockedItems), `stats`, `tokenUsage`.

## Demo 2: Grounded Q&A
```bash
curl -s -X POST http://localhost:3001/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What happened with the payment gateway?"}'
```
Verify: response has `answer` with [sourceId] citations, `confidence`, `sources` array.

## Demo 3: Calibrated Refusal
```bash
curl -s -X POST http://localhost:3001/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the client budget for next quarter?"}'
```
Verify: response has `answer: null`, `refusal` message, `suggestedSources`.

## Demo 4: Knowledge Capture
```bash
curl -s -X POST http://localhost:3001/api/capture/incident \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"INC-4421"}'
```
Verify: response has `entry` with `title`, `content`, `tags`, `sources`, `status: "draft"`.

## Demo 5: Insights
```bash
curl -s -X POST http://localhost:3001/api/insights/flashcards -H "Content-Type: application/json" -d '{"leaveStart":"2025-04-01","leaveEnd":"2025-04-14"}'
curl -s -X POST http://localhost:3001/api/insights/quiz -H "Content-Type: application/json" -d '{"leaveStart":"2025-04-01","leaveEnd":"2025-04-14"}'
curl -s -X POST http://localhost:3001/api/insights/audio -H "Content-Type: application/json" -d '{"leaveStart":"2025-04-01","leaveEnd":"2025-04-14"}'
curl -s -X POST http://localhost:3001/api/insights/infographic -H "Content-Type: application/json" -d '{"leaveStart":"2025-04-01","leaveEnd":"2025-04-14"}'
```

## Build Check
```bash
cd client && npx vite build
```
Must pass with 0 errors.

Report results for each demo scenario.
