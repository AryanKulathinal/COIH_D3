import { runToolLoop, parseJson, CACHED_SYSTEM } from "../claude.js";
import { queryDataSources, searchSources, getSource, getKnowledge, listPeople, getAccount } from "../store.js";

const TOOLS = [
  {
    name: "list_documents",
    description: "All documents on the account (guides, architecture, runbooks, ADRs, postmortems) with their full text.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_knowledge",
    description: "Every confirmed knowledge-base entry the team has captured (incidents, troubleshooting, processes).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_people",
    description: "People directory with roles and the components each person owns.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_open_work",
    description: "Open tickets and incidents — useful for picking realistic starter work and seeing what is active.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_sources",
    description: "Keyword search over all raw records (emails, chats, tickets, incidents, meetings) to check who actually works on what.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "get_source",
    description: "Full record for a sourceId.",
    input_schema: { type: "object", properties: { sourceId: { type: "string" } }, required: ["sourceId"] },
  },
];

const brief = (d) => ({ sourceId: d.sourceId, sourceType: d.sourceType, subject: d.subject, from: d.from, status: d.status, component: d.component, timestamp: d.timestamp, body: d.body.slice(0, 400) });

export async function generateOnboarding({ account, persona, capturedEntries = [] }) {
  const acct = getAccount(account);
  const executeTool = (name, input) => {
    switch (name) {
      case "list_documents": return queryDataSources({ account, sourceType: "document" });
      case "list_knowledge": return getKnowledge({ account, extraEntries: capturedEntries });
      case "list_people": return listPeople({ account });
      case "list_open_work": return [
        ...queryDataSources({ account, sourceType: "ticket" }),
        ...queryDataSources({ account, sourceType: "incident" }),
      ].filter((d) => d.status === "open").map(brief);
      case "search_sources": return searchSources({ account, query: input.query, limit: 8 });
      case "get_source": return getSource({ account, sourceId: input.sourceId }) || { error: "Not found" };
      default: throw new Error(`Unknown tool ${name}`);
    }
  };

  const prompt = `${persona.name} joins ${acct.team} on ${acct.name} (${acct.client}, ${acct.domain}) as a ${persona.role}. Today is ${persona.today}, day 1.
Build a role-specific onboarding path from THIS account's real artifacts — not a generic template. Call list_documents, list_knowledge, list_people and list_open_work in parallel first.

Also build a knowledge-ownership map: find components where operating knowledge sits with a single person (only one owner AND no captured knowledge entry, or explicit signals like "nobody else has touched this"). These are the capture targets before anyone rotates off.

Respond with JSON only:
{
  "summary": "2 sentences: what this team runs and what ${persona.name.split(" ")[0]} should focus on first",
  "weeks": [{ "week": 1, "theme": "...", "items": [{ "title": "...", "detail": "concrete action", "sources": [{ "sourceId": "doc-004 or KB-A-005 ...", "title": "..." }] }] }],
  "mustRead": [{ "sourceId": "...", "title": "...", "why": "..." }],
  "knowledgeHighlights": [{ "kbId": "...", "title": "...", "why": "which alert/situation this prepares them for" }],
  "peopleToKnow": [{ "name": "...", "role": "...", "askAbout": "...", "owns": ["..."] }],
  "ownershipMap": [{ "component": "...", "owners": ["..."], "kbEntries": n, "risk": "high|medium|low", "note": "why" , "sources": [{ "sourceId": "...", "title": "..." }] }],
  "starterTask": { "sourceId": "...", "title": "...", "why": "..." } | null
}
Rules: 3-4 weeks; every item cites real sourceIds or KB ids from the tools; ownershipMap covers every component in the people directory.`;

  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({ system: CACHED_SYSTEM, tools: TOOLS, messages: [{ role: "user", content: prompt }], executeTool, maxRounds: 4 });
  return { plan: parseJson(text), tokenUsage: usage, rounds, ms: Date.now() - started };
}
