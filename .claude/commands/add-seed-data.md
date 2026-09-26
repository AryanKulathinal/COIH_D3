# Add more seed data to the demo

Add new synthetic data entries to `server/src/seed.js` for the COIH demo.

## Context
The demo simulates Priya Sharma returning from 2-week leave (Apr 1-14, 2025) on Team Alpha. The seed file already has 33 records across 6 source types: emails, chats, tickets, documents, meetings, calendar events.

## Rules
1. All entries must have: `sourceType`, `sourceId`, `account: ACCOUNT`, `timestamp` (within Apr 1-14, 2025), `body`
2. Use the `d("2025-04-XXTxx:xx:00Z")` helper for timestamps
3. Entries mentioning `priya.sharma` should set `mentionsUser: true`
4. Entries needing Priya's action should set `requiresAction: true`
5. Meeting transcripts should include timestamped dialogue, decisions, and action items
6. Add to the appropriate array (emails, chats, tickets, documents, meetings, calendarEvents)
7. Update the mock responses in `server/src/services/mockResponses.js` and `mockInsights.js` if the new data introduces significant new storylines
8. Re-seed after changes: `cd server && node src/seed.js`

## Source Types
- `email`: from, to, subject, body, thread, tags, priority
- `chat`: from, channel, body, thread, tags
- `ticket`: sourceId (like JIRA-XXXX), from, subject, body, tags, priority, status
- `document`: from, subject (title), body, tags
- `meeting`: from, to (attendees), subject, body (full transcript), tags, metadata (duration, platform, hasVideo)
- `calendar`: from, to, subject, body (agenda), tags

User request: $ARGUMENTS
