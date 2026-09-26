import { getClient, CACHED_SYSTEM, MODEL, trackUsage } from "./claudeClient.js";
import { queryDataSources, getStats } from "./dataAdapter.js";
import { Brief } from "../models/Brief.js";

const TOOLS = [
  {
    name: "query_emails",
    description: "Query email messages from the leave period. Call this to retrieve emails that arrived during the user's absence. Use mentionsUser=true to find emails that directly involve the user.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date string for start of leave" },
        endDate: { type: "string", description: "ISO date string for end of leave" },
        mentionsUser: { type: "boolean", description: "Filter for emails mentioning the user" },
        requiresAction: { type: "boolean", description: "Filter for emails requiring action" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "query_chats",
    description: "Query chat/Slack messages from the leave period. Call this to retrieve team chat messages during the user's absence.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date string" },
        endDate: { type: "string", description: "ISO date string" },
        mentionsUser: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "query_tickets",
    description: "Query JIRA/ticketing system records from the leave period. Call this to find ticket updates, new assignments, and status changes.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string" },
        endDate: { type: "string" },
        mentionsUser: { type: "boolean" },
        requiresAction: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "query_documents",
    description: "Query documents, ADRs, design docs, and postmortems from the leave period.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string" },
        endDate: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "query_meetings",
    description: "Query meeting recordings and transcripts from the leave period. Returns full meeting transcripts with decisions, action items, and key discussion points. Call this to understand what was discussed in team meetings.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string" },
        endDate: { type: "string" },
        mentionsUser: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "query_calendar",
    description: "Query upcoming calendar events and meetings that need attention after returning.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string" },
        endDate: { type: "string" },
        mentionsUser: { type: "boolean" },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "get_period_stats",
    description: "Get aggregate statistics for the leave period — counts of emails, chats, tickets, action items, etc.",
    input_schema: {
      type: "object",
      properties: {
        startDate: { type: "string" },
        endDate: { type: "string" },
      },
      required: ["startDate", "endDate"],
    },
  },
];

async function executeTool(name, input) {
  const sourceTypeMap = {
    query_emails: "email",
    query_chats: "chat",
    query_tickets: "ticket",
    query_documents: "document",
    query_meetings: "meeting",
    query_calendar: "calendar",
  };

  if (name === "get_period_stats") {
    return JSON.stringify(await getStats(input));
  }

  const sourceType = sourceTypeMap[name];
  if (!sourceType) return JSON.stringify({ error: `Unknown tool: ${name}` });

  const results = await queryDataSources({ ...input, sourceType });
  return JSON.stringify(results);
}

export async function generateBrief({ userId, userName, leaveStart, leaveEnd }) {
  const client = getClient();
  const totalUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, estimatedCost: 0 };

  const briefPrompt = `Generate a comprehensive Return-from-Leave Brief for ${userName} (${userId}).

Leave period: ${leaveStart} to ${leaveEnd}

INSTRUCTIONS:
1. First, get the overall stats for the leave period.
2. Then query ALL source types (emails, chats, tickets, documents, meetings, calendar) for the leave period.
3. Also specifically query for items that mention the user or require their action.
4. Synthesize everything into a structured brief.

OUTPUT FORMAT - respond with valid JSON only, no markdown:
{
  "overview": "2-3 sentence executive summary of what happened during the leave",
  "stats": {
    "totalEmails": <number>,
    "totalChats": <number>,
    "totalTickets": <number>,
    "keyDecisions": <number>,
    "actionItems": <number>
  },
  "sections": {
    "decisions": {
      "title": "Key Decisions Made",
      "items": [
        {
          "summary": "One-line summary",
          "detail": "2-3 sentence detail with context",
          "priority": "high|medium|low",
          "status": "resolved|open|needs_action|fyi",
          "sources": [{"sourceId": "email-001", "sourceType": "email", "title": "Subject line", "snippet": "Key quote from source"}]
        }
      ]
    },
    "workItems": {
      "title": "Your Work Items",
      "items": [...]
    },
    "openQuestions": {
      "title": "Threads Awaiting Your Response",
      "items": [...]
    },
    "incidents": {
      "title": "Incidents in Your Components",
      "items": [...]
    },
    "blockedItems": {
      "title": "Items Blocked on You",
      "items": [...]
    }
  }
}

Critical rules:
- Every item MUST have at least one source with sourceId
- Mark resolved items as "resolved" or "fyi", not "needs_action"
- Items needing user's action: mark as "needs_action"
- Sort items within each section by priority (critical > high > medium > low)
- Be concise but complete — this replaces 3-5 hours of manual catch-up`;

  let messages = [{ role: "user", content: briefPrompt }];

  let response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: CACHED_SYSTEM,
    tools: TOOLS,
    messages,
    thinking: { type: "adaptive" },
  });

  let usage = trackUsage(response);
  Object.keys(totalUsage).forEach((k) => (totalUsage[k] += usage[k]));

  const MAX_ITERATIONS = 12;
  let iteration = 0;

  while (response.stop_reason === "tool_use" && iteration < MAX_ITERATIONS) {
    iteration++;

    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    const toolUseBlocks = assistantContent.filter((b) => b.type === "tool_use");

    const toolResults = [];
    for (const toolBlock of toolUseBlocks) {
      const result = await executeTool(toolBlock.name, toolBlock.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: CACHED_SYSTEM,
      tools: TOOLS,
      messages,
      thinking: { type: "adaptive" },
    });

    usage = trackUsage(response);
    Object.keys(totalUsage).forEach((k) => (totalUsage[k] += usage[k]));
  }

  let briefData;
  const textContent = response.content.find((b) => b.type === "text");
  if (textContent) {
    try {
      const jsonStr = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      briefData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse brief JSON:", e.message);
      briefData = {
        overview: textContent.text,
        stats: {},
        sections: {},
      };
    }
  }

  const brief = await Brief.create({
    userId,
    userName,
    leaveStart: new Date(leaveStart),
    leaveEnd: new Date(leaveEnd),
    overview: briefData.overview,
    sections: briefData.sections,
    stats: briefData.stats,
    tokenUsage: totalUsage,
  });

  return brief;
}
