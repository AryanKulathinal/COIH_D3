import { runToolLoop, parseJson } from "../llm.js";
import { queryDataSources, getStats, listPeople, getAccount } from "../store.js";
import { trackRetrieval, verifyItems } from "../citations.js";

const SOURCE_TYPES = {
  email: "emails", chat: "team chats", ticket: "Jira tickets", incident: "incidents",
  document: "documents", meeting: "meeting transcripts", calendar: "upcoming calendar",
};

// One batched source tool instead of one tool per type: models that make a single tool call
// per turn (e.g. gpt-oss) can still pull every source for the window in one round.
const TOOLS = [
  {
    name: "query_sources",
    description: "Fetch records from one or more connected sources for a date window, grouped by source type. Pass several sourceTypes at once. Types: email, chat, ticket (Jira assignments/status), incident (severity, status, resolver), document (ADRs, design docs, postmortems), meeting (transcripts with decisions and action items), calendar (query from the return date forward for upcoming meetings).",
    input_schema: {
      type: "object",
      properties: {
        sourceTypes: { type: "array", items: { type: "string", enum: Object.keys(SOURCE_TYPES) } },
        startDate: { type: "string", description: "ISO date, start of window" },
        endDate: { type: "string", description: "ISO date, end of window" },
        mentionsUser: { type: "boolean", description: "Only records that mention or address the user" },
        requiresAction: { type: "boolean", description: "Only records that need action" },
      },
      required: ["sourceTypes", "startDate", "endDate"],
    },
  },
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

const label = (name, input) => {
  if (name === "get_period_stats") return "Counting activity";
  if (name === "list_people") return "Mapping component owners";
  const types = (input?.sourceTypes || []).map((t) => SOURCE_TYPES[t]).filter(Boolean);
  return types.length ? `Reading ${types.join(", ")}` : "Reading sources";
};

export async function generateBrief({ account, persona, onEvent }) {
  const acct = getAccount(account);
  const { start, end } = persona.leave;

  const baseTool = (name, input) => {
    if (name === "get_period_stats") return getStats({ account, ...input });
    if (name === "list_people") return listPeople({ account });
    if (name !== "query_sources") throw new Error(`Unknown tool ${name}`);
    const { sourceTypes = Object.keys(SOURCE_TYPES), ...filters } = input;
    return Object.fromEntries(sourceTypes.filter((t) => SOURCE_TYPES[t]).map((t) => [t, queryDataSources({ account, ...filters, sourceType: t }).map(trim)]));
  };

  const prompt = `Generate a Return-from-Leave Brief for ${persona.name} (${persona.userId}), ${persona.role} on ${acct.team}, ${acct.name} (${acct.client}).
Absence window: ${start} to ${end}. Today (first day back): ${persona.today}.

This is NOT an inbox summary. Reconstruct the STATE CHANGE in ${persona.name.split(" ")[0]}'s scope while away — including decisions in threads they were not copied on.
Work efficiently: first call query_sources ONCE with sourceTypes ["email","chat","ticket","incident","document","meeting"] for the absence window, then query_sources for ["calendar"] from ${persona.today} for 14 days, and list_people. Then write the brief — do not re-query the same data.

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

  const { executeTool, ids: retrieved } = trackRetrieval(baseTool);
  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({
    tools: TOOLS,
    messages: [{ role: "user", content: prompt }],
    executeTool,
    maxRounds: 5,
    json: true,
    onEvent: (e) => onEvent?.({ ...e, label: label(e.name, e.input) }),
  });
  const brief = parseJson(text);
  // Keep only lines whose citations point at records actually retrieved for this brief.
  const removed = [];
  for (const section of Object.values(brief.sections || {})) section.items = verifyItems(section.items, retrieved, "sources", removed);
  brief.upcoming = (brief.upcoming || []).map((u) => (u.sourceId && !retrieved.has(u.sourceId) ? (removed.push(u.sourceId), { ...u, sourceId: undefined }) : u));
  return { brief, verification: { removed: [...new Set(removed)] }, tokenUsage: usage, rounds, ms: Date.now() - started, personaId: persona.id, window: { start, end } };
}
