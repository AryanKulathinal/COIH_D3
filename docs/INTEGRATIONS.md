# Integrations: how the mocked connectors map to production

The hackathon rules forbid integration with live production systems, so every source in this prototype is **mocked**: an adapter reads synthetic JSON from `data/<account>/<type>.json`. This document describes how each adapter connects in a real deployment. Nothing downstream of the adapter (store, retrieval, agents, UI) changes.

## Adapter contract

Each adapter produces records in one shape (see `lib/store.js`):

```js
{
  sourceType,          // email | chat | ticket | incident | document | meeting | calendar
  sourceId,            // stable ID in the source system (message ID, issue key, incident ID)
  account,             // isolation key: one index per account, never crossed
  timestamp, from, to, subject, channel,
  body,                // text after PII filtering
  thread,              // conversation / incident thread ID, used to gather incident context
  tags, component,     // component drives incident context and the ownership map
  priority, status, mentionsUser, requiresAction, metadata
}
```

A production adapter module (`lib/adapters/<platform>.js`) exposes:

```js
export async function fetchSince({ account, since, credentials }) { /* raw items */ }
export function transform(raw, { account, userDirectory }) { /* record[] in the shape above */ }
```

A scheduler or webhook handler calls `fetchSince`, then `transform`, then the PII filter, then upserts into the account's index.

## Per-source mapping

| Source | Production API | Auth (read-only) | Sync | Key field mapping |
|---|---|---|---|---|
| Email | Microsoft Graph `GET /users/{id}/messages/delta` | OAuth 2.0 delegated, `Mail.Read` | Delta query every 5 min; on-demand backfill for an absence window | `subject`, `body.content` → body, `from`/`toRecipients`, `conversationId` → thread |
| Calendar | Graph `GET /users/{id}/calendarView?startDateTime&endDateTime` | `Calendars.Read` | Queried when a brief is generated | `subject`, `start.dateTime` → timestamp, `attendees` → to |
| Chat (Teams) | Graph `GET /teams/{id}/channels/{id}/messages/delta` + change notifications | `ChannelMessage.Read.All` (admin-consented, selected teams) | Webhook + delta | `replyToId` → thread, `mentions` → mentionsUser |
| Chat (Slack) | `conversations.history`, `conversations.replies`, Events API | Bot token, `channels:history` | Events API + backfill | `thread_ts` → thread, `<@U…>` mentions → mentionsUser |
| Tickets | Jira Cloud `GET /rest/api/3/search?jql=project=… AND updated >= …` | OAuth 2.0 (3LO), `read:jira-work` | Jira webhooks (created / updated / assignee) + nightly reconcile | `key` → sourceId, `fields.summary` → subject, changelog assignee → `metadata.originalAssignee` |
| Incidents | PagerDuty `GET /incidents` + Webhooks v3; ServiceNow `GET /api/now/table/incident` | Read-only API key scoped to the account's services | `incident.resolved` webhook **triggers the capture engine** | `id` → sourceId, `service` → component, resolution note → capture input |
| Documents | Confluence `GET /wiki/api/v2/pages?space-id=…`; SharePoint Graph `/sites/{id}/drive/root/delta` | `read:confluence-content.all`; `Sites.Selected` | Daily delta; versions kept for decay detection | `title` → subject, `body.storage` → body, `labels` → tags |
| Meetings | Graph `GET /users/{id}/onlineMeetings/{id}/transcripts/{id}/content` | `OnlineMeetingTranscript.Read.All` | `callTranscript` change notification after each meeting | VTT text → body, attendees → to |

## How capture works in production

1. The on-call engineer resolves the incident in PagerDuty or ServiceNow and writes the closing note, as they already do.
2. The `incident.resolved` webhook hits `/api/capture` with the incident ID and the note.
3. The capture engine gathers the incident, its thread and the component's documents, and drafts an entry. The entry records dead-end hypotheses and flags older documents it contradicts (in the demo, the carrier guide that still says 300 requests/min).
4. The engineer receives the draft in Teams and confirms or edits it in one click.
5. The entry is written to the account's knowledge index, and every later question can use it.

In the prototype, step 1 is the **Mark resolved** button, step 4 is the in-page review, and step 5 stores the entry in the browser (localStorage), which is sent with each request.

## Security controls at the adapter layer

- Read-only scopes only; the hub never writes to a source system.
- Credentials come from environment variables or a secrets vault, never from code.
- PII and client-sensitive fields are filtered before indexing.
- Retrieval respects the requester's source-system entitlements: the hub never shows anything the associate could not already open.
- One index per account; `account` is required on every store call.
- Every answer logs its sources and the requester for audit.
