import { runToolLoop, parseJson } from "../llm.js";
import { searchSources, getSource, searchKnowledge, listPeople, getAccount } from "../store.js";

const SOURCE_TOOLS = [
  {
    name: "search_sources",
    description: "Keyword search (BM25) over the account's raw records: emails, chats, tickets, incidents, documents, meeting transcripts, calendar. Returns ranked hits with a snippet. Rephrase and search several times with different keywords if the first search is weak.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords, component names, ticket/incident IDs, people" },
        sourceTypes: { type: "array", items: { type: "string", enum: ["email", "chat", "ticket", "incident", "document", "meeting", "calendar"] } },
        startDate: { type: "string", description: "ISO date (optional)" },
        endDate: { type: "string", description: "ISO date (optional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_source",
    description: "Fetch the full record for a sourceId returned by search_sources (full body, participants, metadata).",
    input_schema: { type: "object", properties: { sourceId: { type: "string" } }, required: ["sourceId"] },
  },
  {
    name: "list_people",
    description: "The account's people directory: names, roles, and the components each person owns. Use it to name who to ask when evidence is missing.",
    input_schema: { type: "object", properties: {} },
  },
];

const KB_TOOL = {
  name: "search_knowledge_base",
  description: "Search the account's captured knowledge base: structured entries (symptom, root cause, resolution, prevention) automatically captured from resolved incidents and answered questions, confirmed by an engineer. Search this FIRST for any how-to, troubleshooting, incident or process question.",
  input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
};

const OUTPUT_SPEC = `Respond with JSON only:
{
  "answer": "Grounded answer in short paragraphs or numbered steps, with inline [sourceId] or [KB-id] citations after each claim" | null,
  "confidence": "high" | "medium" | "low" | "none",
  "sources": [{ "sourceId": "...", "sourceType": "email|chat|ticket|incident|document|meeting|calendar|knowledge", "title": "...", "snippet": "short supporting quote" }],
  "gaps": ["what evidence is missing or uncertain"],
  "refusal": "Only when you cannot answer: why, and exactly which evidence is missing" | null,
  "suggestedContact": { "name": "...", "reason": "why this person likely knows" } | null
}
Confidence: high = multiple corroborating records or a confirmed knowledge entry; medium = one clear record; low = partial evidence requiring inference (say so); none = refusal (answer null).
If the records only show symptoms, hypotheses or an open incident but no confirmed fix, do NOT invent a fix — refuse or answer with low confidence, and suggest the owner/on-call person.`;

function modeInstructions(kbConnected) {
  return kbConnected
    ? `MODE: knowledge layer CONNECTED. Search the knowledge base first, then corroborate with raw records. Prefer confirmed knowledge entries for procedures and fixes and cite their KB id with sourceType "knowledge".`
    : `MODE: raw sources ONLY (the knowledge layer is disconnected — this simulates plain enterprise search). You only have the raw records.`;
}

export async function answerQuestion({ account, persona, question, history = [], kbMode = "connected", capturedEntries = [] }) {
  const kbConnected = kbMode !== "disconnected";
  const acct = getAccount(account);
  const tools = kbConnected ? [KB_TOOL, ...SOURCE_TOOLS] : SOURCE_TOOLS;

  const executeTool = (name, input) => {
    switch (name) {
      case "search_sources": return searchSources({ account, ...input, limit: 8 });
      case "get_source": return getSource({ account, sourceId: input.sourceId }) || { error: "No such record in this account" };
      case "list_people": return listPeople({ account });
      case "search_knowledge_base": return searchKnowledge({ account, query: input.query, extraEntries: capturedEntries });
      default: throw new Error(`Unknown tool ${name}`);
    }
  };

  const context = `Account: ${acct.name} — client ${acct.client} (${acct.domain}).
User: ${persona?.name || "an associate"}${persona ? `, ${persona.role}` : ""}. Today is ${persona?.today || "2025-04-15"}.
${modeInstructions(kbConnected)}

${OUTPUT_SPEC}`;

  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
    { role: "user", content: `${context}\n\nQUESTION: ${question}` },
  ];

  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({ tools, messages, executeTool, maxRounds: 5, maxTokens: 8000 });

  let parsed;
  try {
    parsed = parseJson(text);
  } catch {
    parsed = { answer: text, confidence: "low", sources: [], gaps: ["Response was not structured"] };
  }
  return { ...parsed, kbMode: kbConnected ? "connected" : "disconnected", tokenUsage: usage, rounds, ms: Date.now() - started };
}
