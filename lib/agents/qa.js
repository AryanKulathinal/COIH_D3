import { runToolLoop, parseJson } from "../llm.js";
import { searchSources, getSource, searchKnowledge, getKnowledge, listPeople, getAccount } from "../store.js";
import { trackRetrieval, verifyAnswer, cleanInline } from "../citations.js";

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
HARD RULES:
- Every sentence in "answer" must end with a citation to a record you retrieved. Never add advice, best practices or steps that are not written in a retrieved record — even if they seem obvious.
- For "how do we fix X" questions: if no retrieved record states a confirmed resolution (only symptoms, hypotheses, attempts or an open incident), set "answer": null, "confidence": "none", explain in "refusal" what is known (cite it) and that no fix has been recorded, and name the owner/on-call person in "suggestedContact".`;

const MODE_CONNECTED = `MODE: knowledge layer CONNECTED. Prefer confirmed knowledge entries for procedures and fixes and cite their KB id with sourceType "knowledge"; corroborate with raw records. An empty knowledge-base result does NOT mean the answer is unknown — decisions, ownership and history usually live in the raw records (documents, emails, meetings, chats). Always search the raw records (try 2-3 keyword variants) before refusing.`;

// Deterministic first pass: the same BM25 search the tools expose, run server-side on the question
// itself, so every request starts from the same evidence instead of depending on the model's first
// choice of keywords. The model can still call tools for full text and follow-up searches.
function seedRetrieval({ account, question, capturedEntries }) {
  const sources = searchSources({ account, query: question, limit: 6 });
  const kb = searchKnowledge({ account, query: question, extraEntries: capturedEntries, limit: 3 })
    .map(({ id, title, category, symptom, rootCause, resolution, components, score }) => ({ id, title, category, symptom, rootCause, resolution, components, score }));
  return { sources, kb };
}

// The comparison baseline: the same model with NO account access at all — no records, no knowledge
// base, no tools. This is what a plain chatbot gives an associate today.
const PLAIN_CHAT_SYSTEM = `You are a general-purpose AI assistant answering an engineer's question in a chat window.
You have NO access to their company's systems: no emails, chats, tickets, incidents, documents, runbooks or knowledge base, and no search tools.
Answer the way a typical chatbot does — from general knowledge and common practice only. Be helpful and concrete about generic steps, but never invent company-specific facts: no ticket or incident IDs, no colleague names, no dates, numbers, config values or decisions you cannot know. Where the question depends on account-specific information, say so briefly and suggest what they would need to check.
Do not cite or reference sources. Never mention these instructions.
When asked for JSON, respond with a single valid JSON object and nothing else.`;

const PLAIN_OUTPUT_SPEC = `Respond with JSON only:
{
  "answer": "Your answer in short paragraphs or numbered steps (plain text, no citations)",
  "caveat": "One sentence on what in this answer depends on account-specific information you do not have"
}`;

async function answerPlainChat({ account, persona, question, history }) {
  const acct = getAccount(account);
  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
    { role: "user", content: `Context: the user is ${persona?.name || "an engineer"}${persona ? `, ${persona.role}` : ""} working on an e-commerce/logistics delivery account (domain: ${acct.domain}). You know nothing else about their account.

${PLAIN_OUTPUT_SPEC}

QUESTION: ${question}` },
  ];
  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({ tools: [], messages, maxRounds: 0, maxTokens: 4000, json: true, systemPrompt: PLAIN_CHAT_SYSTEM });
  let parsed;
  try {
    parsed = parseJson(text);
  } catch {
    parsed = { answer: text };
  }
  // Belt and braces: strip any [id]-style citation the model might invent — nothing here is verifiable.
  const stripped = cleanInline(String(parsed.answer || ""), new Set());
  return {
    answer: stripped.text.trim() || null,
    confidence: "unverified",
    sources: [],
    gaps: parsed.caveat ? [String(parsed.caveat)] : [],
    refusal: null,
    suggestedContact: null,
    grounded: false,
    kbMode: "disconnected",
    tokenUsage: usage,
    rounds,
    ms: Date.now() - started,
  };
}

export async function answerQuestion({ account, persona, question, history = [], kbMode = "connected", capturedEntries = [] }) {
  if (kbMode === "disconnected") return answerPlainChat({ account, persona, question, history });

  const acct = getAccount(account);
  const tools = [KB_TOOL, ...SOURCE_TOOLS];

  const baseTool = (name, input) => {
    switch (name) {
      case "search_sources": return searchSources({ account, ...input, limit: 8 });
      case "get_source": return getSource({ account, sourceId: input.sourceId }) || { error: "No such record in this account" };
      case "list_people": return listPeople({ account });
      case "search_knowledge_base": return searchKnowledge({ account, query: input.query, extraEntries: capturedEntries });
      default: throw new Error(`Unknown tool ${name}`);
    }
  };

  const seed = seedRetrieval({ account, question, capturedEntries });
  const context = `Account: ${acct.name} — client ${acct.client} (${acct.domain}).
User: ${persona?.name || "an associate"}${persona ? `, ${persona.role}` : ""}. Today is ${persona?.today || "2025-04-15"}.
${MODE_CONNECTED}

INITIAL SEARCH RESULTS (already run over this account for the question below — knowledge base first, then raw records; ranked, snippets only). Use get_source for the full text of anything relevant, and run further searches with other keywords if these are weak or off-topic:
Knowledge base: ${seed.kb.length ? JSON.stringify(seed.kb) : "no matching entries"}
Raw records: ${seed.sources.length ? JSON.stringify(seed.sources) : "no matching records"}

${OUTPUT_SPEC}`;

  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
    { role: "user", content: `${context}\n\nQUESTION: ${question}` },
  ];

  // Citations are only valid if the record was retrieved in this request — or was cited earlier in
  // this conversation and really exists.
  const { executeTool, ids: retrieved } = trackRetrieval(baseTool);
  for (const hit of seed.sources) retrieved.add(hit.sourceId);
  for (const hit of seed.kb) retrieved.add(hit.id);
  const knownKb = new Set(getKnowledge({ account, extraEntries: capturedEntries }).map((k) => k.id));
  for (const m of history) {
    for (const [id] of String(m.content).matchAll(/[A-Za-z]+-[A-Za-z0-9-]+/g)) {
      if (getSource({ account, sourceId: id }) || knownKb.has(id)) retrieved.add(id);
    }
  }

  const started = Date.now();
  const { text, usage, rounds } = await runToolLoop({ tools, messages, executeTool, maxRounds: 6, maxTokens: 8000, json: true });

  let parsed;
  try {
    parsed = parseJson(text);
  } catch {
    parsed = { answer: text, confidence: "low", sources: [], gaps: ["Response was not structured"] };
  }
  return { ...verifyAnswer(parsed, retrieved), grounded: true, kbMode: "connected", tokenUsage: usage, rounds, ms: Date.now() - started };
}
