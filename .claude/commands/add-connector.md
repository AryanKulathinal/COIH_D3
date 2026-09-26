# Add a real data source connector

Build a real connector that integrates with an external API to pull data into COIH.

## Architecture
Connectors follow the adapter pattern. Each connector:
1. Authenticates with the source system (OAuth, API key, or webhook)
2. Queries data for a date range
3. Transforms source-specific format into the COIH `DataSource` schema
4. Saves to MongoDB

## Implementation Steps

1. Create adapter file: `server/src/adapters/{platform}Adapter.js`
2. Implement these functions:
   - `authenticate(config)` — returns auth token/client
   - `fetchData({ startDate, endDate, userId })` — returns raw data from API
   - `transform(rawData)` — maps to DataSource schema: `{ sourceType, sourceId, timestamp, from, to, subject, body, tags, priority, status, mentionsUser, requiresAction, metadata }`
   - `sync(config)` — orchestrates auth → fetch → transform → save

3. Register in `server/src/routes/connectors.js` — add a POST `/:id/sync-live` route
4. Add the connector to the default connectors list with `authType: "oauth"` or `"api_key"`

## Available APIs
- **Microsoft Graph** (email + calendar + Teams): `npm install @microsoft/microsoft-graph-client`
- **Slack Bolt SDK** (chat): `npm install @slack/bolt`
- **Jira REST API**: `npm install jira-client` or raw fetch
- **Confluence**: Atlassian REST API
- **Zoom/Teams recordings**: Respective APIs for meeting transcripts

## Rules
- Never store API keys in code — use environment variables
- All connectors must work behind the `isLiveMode()` check
- Transform must set `account: "demo-account"` for the demo
- Set `mentionsUser: true` when the data mentions the returning user

User request: $ARGUMENTS
