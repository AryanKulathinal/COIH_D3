import { runToolLoop, parseJson } from "../llm.js";
import { queryDataSources, getStats, listPeople, getAccount } from "../store.js";

const windowProps = {
  startDate: { type: "string", description: "ISO date, start of window" },
  endDate: { type: "string", description: "ISO date, end of window" },
  mentionsUser: { type: "boolean", description: "Only records that mention or address the user" },
  requiresAction: { type: "boolean", description: "Only records that need action" },
  tags: { type: "array", items: { type: "string" } },
};

const SOURCE_TOOLS = {
  query_emails: ["email", "Emails received by the team or the user during the window."],
  query_chats: ["chat", "Team chat / Slack / Teams channel messages during the window."],
  query_tickets: ["ticket", "Jira tickets: new assignments, reassignments, status changes."],
  query_incidents: ["incident", "Production incidents raised in the window, with severity, status and resolver."],
  query_documents: ["document", "ADRs, design docs and postmortems written during the window."],
  query_meetings: ["meeting", "Meeting transcripts with decisions and action items."],
  query_calendar: ["calendar", "Calendar events. Query from the return date forward to find upcoming meetings needing prep."],
};

const TOOLS = [
  ...Object.entries(SOURCE_TOOLS).map(([name, [, description]]) => ({
    name,
    description,
    input_schema: { type: "object", properties: windowProps, required: ["startDate", "endDate"] },
  })),
  {
    name: "get_period_stats",
    description: "Counts of records by source type, action items and mentions for a window.",
    input_schema: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" } }, required: ["startDate", "endDate"] },
  },
  {
    name: "list_people",
    description: "People directory with roles and component ownership — use to decide which components are the user's.",
    input_schema: { type: "object", properties: {} },
  },
];

const trim = (d) => ({
  sourceId: d.sourceId, sourceType: d.sourceType, timestamp: d.timestamp, from: d.from, to: d.to,
  subject: d.subject || d.channel, body: d.body, thread: d.thread, status: d.status, priority: d.priority,
  component: d.component, mentionsUser: d.mentionsUser, requiresAction: d.requiresAction, metadata: d.metadata,
});

const LABELS = {
  query_emails: "Reading emails", query_chats: "Reading team chats", query_tickets: "Checking Jira tickets",
  query_incidents: "Checking incidents", query_documents: "Reading documents", query_meetings: "Reading meeting transcripts",
  query_calendar: "Checking upcoming calendar", get_period_stats: "Counting activity", list_people: "Mapping component owners",
};

export async function generateBrief({ account, persona, onEvent }) {
  const acct = getAccount(account);
  const { start, end } = persona.leave;

  const executeTool = (name, input) => {
    if (name === "get_period_stats") return getStats({ account, ...input });
    if (name === "list_people") return listPeople({ account });
    const [sourceType] = SOURCE_TOOLS[name] || [];
    if (!sourceType) throw new Error(`Unknown tool ${name}`);
    return queryDataSources({ account, ...input, sourceType }).map(trim);
  };

  const prompt = `Generate a Return-from-Leave Brief for ${persona.name} (${persona.userId}), ${persona.role} on ${acct.team}, ${acct.name} (${acct.client}).
Absence window: ${start} to ${end}. Today (first day back): ${persona.today}.

This is NOT an inbox summary. Reconstruct the STATE CHANGE in ${persona.name.split(" ")[0]}'s scope while away — including decisions in threads they were not copied on.
Work efficiently: in your first turn call get_period_stats, list_people and every query_* tool for the window IN PARALLEL (calendar: from ${persona.today} for 14 days). Only make follow-up calls if something is missing.

Respond with JSON only:
{
  "overview": "2-3 sentences: what changed and how many things need them",
  "stats": { "emails": n, "chats": n, "tickets": n, "incidents": n, "meetings": n, "documents": n, "decisions": n, "actionItems": n },
  "sections": {
    "decisions":     { "title": "Decisions made in your area", "items": [ITEM] },
    "workItems":     { "title": "Work assigned, reassigned or escalated to you", "items": [ITEM] },
    "openQuestions": { "title": "Threads still waiting on your reply", "items": [ITEM] },
    "incidents":     { "title": "Incidents in your components", "items": [ITEM] },
    "blockedItems":  { "title": "Blocked on your input (oldest first)", "items": [ITEM] }
  },
  "upcoming": [{ "when": "ISO date", "title": "...", "prep": "what to prepare", "sourceId": "..." }]
}
ITEM = { "summary": "one line", "detail": "1-2 sentences of context", "priority": "critical|high|medium|low", "status": "needs_action|open|resolved|fyi", "date": "ISO date of the originating record", "whereDecided": "e.g. Architecture Review meeting / email thread", "sources": [{ "sourceId": "...", "sourceType": "...", "title": "...", "snippet": "short quote" }] }
Rules: every item cites at least one sourceId; sort by priority within sections (blockedItems by age, oldest first); resolved incidents are status "resolved"; skip HR/company-wide noise unless it needs action.`;

  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({
    tools: TOOLS,
    messages: [{ role: "user", content: prompt }],
    executeTool,
    maxRounds: 4,
    onEvent: (e) => onEvent?.({ ...e, label: LABELS[e.name] || e.name }),
  });
  const brief = parseJson(text);
  return { brief, tokenUsage: usage, rounds, ms: Date.now() - started, personaId: persona.id, window: { start, end } };
}
