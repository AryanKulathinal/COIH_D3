import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

let client = null;
export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error("Claude is not configured on this deployment (ANTHROPIC_API_KEY missing)"), { status: 503 });
  }
  if (!client) client = new Anthropic({ maxRetries: 2 });
  return client;
}

const SYSTEM_PROMPT = `You are the Central Operational Intelligence Hub (COIH) for a UST delivery account.
You answer from the account's own operational artifacts — emails, chats, tickets, incidents, documents, meetings, calendar — and from the account's captured knowledge base.

Core principles:
1. GROUNDED: Every claim must be backed by a retrieved record. Never use general knowledge to fill gaps about this account.
2. SOURCE-BOUND: Cite the exact sourceId (e.g. email-001, INC-4421) or knowledge entry id (e.g. KB-A-003) for every claim.
3. CALIBRATED REFUSAL: If the evidence is insufficient, say so plainly, name the specific gap, and name the person most likely to know (from the people directory / component owners).
4. ACTIONABLE: Put items that still need the user's attention ahead of resolved or FYI items.
5. CONCISE: Summarise; the user wants a brief, not a transcript.
6. ACCOUNT-SCOPED: You can only see one account. Never speculate about other accounts or clients.

Output rules: when asked for JSON, respond with a single valid JSON object and nothing else — no markdown fences, no commentary.`;

export const CACHED_SYSTEM = [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }];

// Claude Sonnet 5 list prices (USD per million tokens).
const PRICE = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 };

export function emptyUsage() {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, estimatedCost: 0, apiCalls: 0 };
}

export function addUsage(total, response) {
  const u = response.usage;
  total.inputTokens += u.input_tokens;
  total.outputTokens += u.output_tokens;
  total.cacheReadTokens += u.cache_read_input_tokens || 0;
  total.cacheCreationTokens += u.cache_creation_input_tokens || 0;
  total.apiCalls += 1;
  total.estimatedCost = Number((
    (total.inputTokens * PRICE.input +
      total.outputTokens * PRICE.output +
      total.cacheReadTokens * PRICE.cacheRead +
      total.cacheCreationTokens * PRICE.cacheWrite) / 1_000_000
  ).toFixed(5));
  return total;
}

// Manual agentic loop: Claude picks tools, we run every tool_use block of a turn in
// parallel and return all results in one user message, until Claude stops or we hit maxRounds.
export async function runToolLoop({ system = CACHED_SYSTEM, tools, messages, executeTool, maxRounds = 6, maxTokens = 16000, onEvent }) {
  const anthropic = getClient();
  const usage = emptyUsage();
  const request = (withTools) =>
    anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      ...(tools?.length ? { tools, tool_choice: { type: withTools ? "auto" : "none" } } : {}),
      messages,
      thinking: { type: "adaptive" },
      cache_control: { type: "ephemeral" },
    });

  let response = await request(true);
  addUsage(usage, response);
  let rounds = 0;

  while (response.stop_reason === "tool_use" && rounds < maxRounds) {
    rounds++;
    messages.push({ role: "assistant", content: response.content });
    const calls = response.content.filter((b) => b.type === "tool_use");
    const results = await Promise.all(calls.map(async (call) => {
      onEvent?.({ type: "tool", name: call.name, input: call.input });
      try {
        const output = await executeTool(call.name, call.input);
        return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(output) };
      } catch (err) {
        return { type: "tool_result", tool_use_id: call.id, content: `Error: ${err.message}`, is_error: true };
      }
    }));
    messages.push({ role: "user", content: results });
    // On the last allowed round, disable tool calls so Claude must synthesise an answer.
    response = await request(rounds < maxRounds);
    addUsage(usage, response);
  }

  if (response.stop_reason === "refusal") throw new Error("Claude declined this request");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return { text, usage, rounds };
}

export function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Claude did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}
