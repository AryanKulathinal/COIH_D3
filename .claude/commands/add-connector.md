# Add a data source connector

Connectors follow the adapter pattern: every source is normalised into one record shape, so retrieval, agents and UI never change.

## Record shape (see lib/store.js)
`{ sourceType, sourceId, account, timestamp, from, to, subject, channel, body, thread, tags, component, priority, status, mentionsUser, requiresAction, metadata }`

## For the hackathon (mocked — no live production systems allowed)
1. Add `data/<account>/<type>.json` with synthetic records in the shape above
2. Add the type to `SOURCE_FILES` in `lib/store.js` and `client/src/data.js`, and to `SOURCE_TYPES` (label, colour, system name) in `client/src/data.js`
3. Document the production integration in the `CONNECTORS` list in `client/src/pages/ConnectorsPage.jsx` and in `docs/INTEGRATIONS.md` (API, read-only scope, sync mode, field mapping)
4. If agents should query it directly, add a tool in `lib/agents/brief.js` (`SOURCE_TOOLS`) and extend the `sourceTypes` enum in `lib/agents/qa.js`

## For production (roadmap)
Create `lib/adapters/<platform>.js` exporting `fetchSince({ account, since })` and `transform(raw) → record[]`, run it on a schedule or webhook, filter PII before indexing, and write into the account's index. Credentials come from environment variables / a vault, never code.

User request: $ARGUMENTS
