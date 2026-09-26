import { getClient, CACHED_SYSTEM, MODEL, trackUsage } from "./claudeClient.js";
import { queryDataSources, searchKnowledge } from "./dataAdapter.js";

const QA_TOOLS = [
  {
    name: "search_data_sources",
    description: "Search across all data sources (emails, chats, tickets, documents, meeting transcripts) by keyword tags or date range. Call this when the user asks about specific topics, events, or decisions. Meeting transcripts contain full conversation records with timestamps, decisions, and action items.",
    input_schema: {
      type: "object",
      properties: {
        sourceType: { type: "string", enum: ["email", "chat", "ticket", "document", "calendar", "meeting"], description: "Type of source to search. Use 'meeting' to search meeting recordings and transcripts." },
        startDate: { type: "string", description: "ISO date" },
        endDate: { type: "string", description: "ISO date" },
        tags: { type: "array", items: { type: "string" } },
        mentionsUser: { type: "boolean" },
        requiresAction: { type: "boolean" },
      },
    },
  },
  {
    name: "search_knowledge_base",
    description: "Search the knowledge base for documented operational knowledge — resolved incidents, processes, troubleshooting guides. Call this when the user asks about known issues, past incidents, or standard procedures.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["query"],
    },
  },
];

export async function answerQuestion({ question, conversationHistory = [] }) {
  const client = getClient();
  const totalUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, estimatedCost: 0 };

  const qaSystem = [
    ...CACHED_SYSTEM,
    {
      type: "text",
      text: `You are answering operational questions. Follow these rules strictly:

1. GROUNDED ANSWERS ONLY: Every fact you state must come from a retrieved source. Cite the sourceId.
2. CALIBRATED REFUSAL: If you cannot find evidence to answer the question, say:
   "I don't have sufficient evidence to answer this. The gap is: [describe what data is missing]."
   Never guess or hallucinate an answer.
3. SOURCE BINDING: Format answers with inline citations like [sourceId].
4. When answering, indicate your confidence:
   - HIGH: Multiple corroborating sources
   - MEDIUM: Single source, clear evidence
   - LOW: Partial evidence, inference required (state your reasoning)

Respond in this JSON format:
{
  "answer": "Your grounded answer with [sourceId] citations",
  "confidence": "high|medium|low",
  "sources": [{"sourceId": "...", "sourceType": "...", "title": "...", "snippet": "relevant quote"}],
  "gaps": ["List any information gaps that could strengthen the answer"] | null
}

If you cannot answer, respond:
{
  "answer": null,
  "refusal": "Clear explanation of why you can't answer and what evidence is missing",
  "suggestedSources": ["Where the user might find this information"],
  "confidence": "none"
}`,
    },
  ];

  const messages = [
    ...conversationHistory,
    { role: "user", content: question },
  ];

  let response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: qaSystem,
    tools: QA_TOOLS,
    messages,
    thinking: { type: "adaptive" },
  });

  let usage = trackUsage(response);
  Object.keys(totalUsage).forEach((k) => (totalUsage[k] += usage[k]));

  let iteration = 0;
  while (response.stop_reason === "tool_use" && iteration < 6) {
    iteration++;

    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    const toolUseBlocks = assistantContent.filter((b) => b.type === "tool_use");
    const toolResults = [];

    for (const toolBlock of toolUseBlocks) {
      let result;
      if (toolBlock.name === "search_data_sources") {
        result = await queryDataSources(toolBlock.input);
      } else if (toolBlock.name === "search_knowledge_base") {
        result = await searchKnowledge(toolBlock.input);
      } else {
        result = { error: `Unknown tool: ${toolBlock.name}` };
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: qaSystem,
      tools: QA_TOOLS,
      messages,
      thinking: { type: "adaptive" },
    });

    usage = trackUsage(response);
    Object.keys(totalUsage).forEach((k) => (totalUsage[k] += usage[k]));
  }

  let parsed;
  const textContent = response.content.find((b) => b.type === "text");
  if (textContent) {
    try {
      const jsonStr = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { answer: textContent.text, confidence: "medium", sources: [], gaps: null };
    }
  }

  return { ...parsed, tokenUsage: totalUsage };
}
