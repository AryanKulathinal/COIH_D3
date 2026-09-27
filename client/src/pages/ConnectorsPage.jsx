import { useState } from "react";
import { Plug, ChevronDown, ChevronRight, ShieldCheck, Workflow } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";
import { SOURCE_TYPES } from "../data.js";

// How each mocked adapter maps to the real system in production. Mirrors docs/INTEGRATIONS.md.
const CONNECTORS = [
  { type: "email", endpoint: "GET /users/{id}/messages/delta (Microsoft Graph)", auth: "OAuth 2.0 delegated · Mail.Read", sync: "Delta query every 5 min; on-demand backfill for an absence window", mapping: "subject → subject, body.content → body, from/toRecipients → from/to, conversationId → thread" },
  { type: "chat", endpoint: "GET /teams/{id}/channels/{id}/messages/delta (Graph) · conversations.history (Slack)", auth: "ChannelMessage.Read.All (application, admin-consented) · Slack channels:history", sync: "Change notifications (webhooks) + delta", mapping: "channel → channel, replyToId → thread, mentions → mentionsUser" },
  { type: "ticket", endpoint: "GET /rest/api/3/search?jql=project=… AND updated>=… (Jira Cloud)", auth: "OAuth 2.0 (3LO) · read:jira-work", sync: "Jira webhooks for create/update/assign + nightly reconcile", mapping: "key → sourceId, fields.summary → subject, assignee changes → metadata.originalAssignee" },
  { type: "incident", endpoint: "GET /incidents + Webhooks v3 (PagerDuty) · /api/now/table/incident (ServiceNow)", auth: "Read-only API key scoped to the account's services", sync: "incident.resolved webhook → triggers the capture engine automatically", mapping: "id → sourceId, service → component, resolution note → capture input" },
  { type: "document", endpoint: "GET /wiki/api/v2/pages?space-id=… (Confluence) · /sites/{id}/drive/root/delta (SharePoint)", auth: "read:confluence-content.all · Sites.Read.All (selected sites)", sync: "Space/site delta daily; version history kept for decay detection", mapping: "title → subject, body.storage → body, labels → tags" },
  { type: "meeting", endpoint: "GET /users/{id}/onlineMeetings/{id}/transcripts (Graph)", auth: "OnlineMeetingTranscript.Read.All", sync: "callTranscript change notification after each meeting", mapping: "VTT transcript → body, attendees → to, subject → subject" },
  { type: "calendar", endpoint: "GET /users/{id}/calendarView?startDateTime=…&endDateTime=… (Graph)", auth: "Calendars.Read", sync: "Queried at brief time for the return window", mapping: "subject → subject, start.dateTime → timestamp, attendees → to" },
];

const ADAPTER_SHAPE = `{
  sourceType, sourceId, account,     // account = isolation key
  timestamp, from, to, subject, channel,
  body, thread, tags, component,
  priority, status, mentionsUser, requiresAction, metadata
}`;

function Row({ c, count, last }) {
  const [open, setOpen] = useState(false);
  const t = SOURCE_TYPES[c.type];
  return (
    <div className="card" style={{ padding: "0.625rem 0.75rem" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", background: "none", padding: 0, textAlign: "left" }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "50%", background: t.color }} />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)" }}>{t.system}</span>
          <span style={{ display: "block", fontSize: "0.625rem", color: "var(--text-muted)" }}>{t.label} adapter · {count} records · latest {last ? new Date(last).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
        </span>
        <span className="badge badge-open">mocked · synthetic data</span>
      </button>
      {open && (
        <div className="fade-in" style={{ marginTop: "0.625rem", display: "grid", gridTemplateColumns: "7rem 1fr", gap: "0.375rem 0.75rem", fontSize: "0.688rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Production API</span><code style={{ fontSize: "0.656rem" }}>{c.endpoint}</code>
          <span style={{ color: "var(--text-muted)" }}>Auth / scope</span><span>{c.auth} · read-only</span>
          <span style={{ color: "var(--text-muted)" }}>Sync</span><span>{c.sync}</span>
          <span style={{ color: "var(--text-muted)" }}>Field mapping</span><span>{c.mapping}</span>
          <span style={{ color: "var(--text-muted)" }}>Demo source</span><code style={{ fontSize: "0.656rem" }}>data/&lt;account&gt;/{c.type === "calendar" ? "calendar" : `${c.type}s`}.json</code>
        </div>
      )}
    </div>
  );
}

export default function ConnectorsPage() {
  const { account, seed } = useSession();
  const stats = (type) => {
    const rows = seed.sources.filter((s) => s.sourceType === type);
    return { count: rows.length, last: rows.at(-1)?.timestamp };
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", display: "flex", alignItems: "center", gap: "0.375rem" }}><Plug size={16} /> Connectors · {account.name}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
          Every source plugs in through one adapter interface, so a new account is configuration, not a rebuild. In this demo each adapter reads synthetic JSON; expand one to see how the production integration works.
        </p>
      </div>

      {CONNECTORS.map((c) => <Row key={c.type} c={c} {...stats(c.type)} />)}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className="card">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}><Workflow size={14} color="var(--primary)" /> Common adapter record</h3>
          <pre style={{ fontSize: "0.656rem", background: "var(--grey-200)", padding: "0.5rem", borderRadius: "var(--radius-md)", overflowX: "auto" }}>{ADAPTER_SHAPE}</pre>
          <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>Retrieval (MiniSearch BM25 today, swappable for a vector/hybrid index), the agents and the UI only ever see this shape.</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}><ShieldCheck size={14} color="var(--success)" /> Guardrails at the adapter layer</h3>
          <ul style={{ fontSize: "0.688rem", color: "var(--grey-700)", paddingLeft: "1rem", lineHeight: 1.8 }}>
            <li>Read-only scopes; no writes to any source system</li>
            <li>One index per account — no query crosses an account boundary</li>
            <li>PII and client-sensitive fields filtered before indexing</li>
            <li>Answers respect the requester's existing entitlements</li>
            <li>Every answer logs its sources and requester (audit trail)</li>
            <li>No live production systems are touched in this prototype</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
