// Provider-neutral LLM layer. Runtime model: openai/gpt-oss-120b via OpenRouter's
// OpenAI-compatible Chat Completions API. Agents only use runToolLoop + parseJson, so
// swapping to an enterprise-approved model (e.g. Claude on Bedrock) is a change to this file only.
const ENDPOINT = `${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`;
export const MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";
const REASONING_EFFORT = process.env.LLM_REASONING_EFFORT || "medium";
const REQUEST_TIMEOUT_MS = 55_000;

export const SYSTEM_PROMPT = `You are the Central Operational Intelligence Hub (COIH) for a UST delivery account.
You answer from the account's own operational artifacts — emails, chats, tickets, incidents, documents, meetings, calendar — and from the account's captured knowledge base.

Core principles:
1. GROUNDED: Every claim must be backed by a retrieved record. Never use general knowledge to fill gaps about this account.
2. SOURCE-BOUND: Cite the exact sourceId (e.g. email-001, INC-4421) or knowledge entry id (e.g. KB-A-003) for every claim.
3. CALIBRATED REFUSAL: If the evidence is insufficient, say so plainly, name the specific gap, and name the person most likely to know (from the people directory / component owners).
4. ACTIONABLE: Put items that still need the user's attention ahead of resolved or FYI items.
5. CONCISE: Summarise; the user wants a brief, not a transcript.
6. ACCOUNT-SCOPED: You can only see one account. Never speculate about other accounts or clients.

Output rules: when asked for JSON, respond with a single valid JSON object and nothing else — no markdown fences, no commentary.`;

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw Object.assign(new Error("The AI model is not configured on this deployment (OPENROUTER_API_KEY missing)"), { status: 503 });
  return key;
}

// Agents define tools as { name, description, input_schema }; OpenAI format wraps them as functions.
const toFunctionTools = (tools) =>
  tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));

export function emptyUsage() {
  return { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cacheReadTokens: 0, estimatedCost: 0, apiCalls: 0, model: MODEL };
}

function addUsage(total, data) {
  const u = data.usage || {};
  total.inputTokens += u.prompt_tokens || 0;
  total.outputTokens += u.completion_tokens || 0;
  total.reasoningTokens += u.completion_tokens_details?.reasoning_tokens || 0;
  total.cacheReadTokens += u.prompt_tokens_details?.cached_tokens || 0;
  total.estimatedCost = Number((total.estimatedCost + (u.cost || 0)).toFixed(6)); // OpenRouter reports actual USD charged
  total.apiCalls += 1;
  if (data.model) total.model = data.model;
  return total;
}

async function complete(body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AryanKulathinal/COIH_D3",
        "X-Title": "COIH - Central Operational Intelligence Hub",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && !data.error) return data;
    const status = data.error?.code || res.status;
    if (attempt < 1 && (status === 429 || status >= 500)) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    throw Object.assign(new Error(`Model provider error (${status}): ${data.error?.message || res.statusText}`), { status: 502 });
  }
}

const parseArgs = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Manual agentic loop: the model picks tools, we run every tool call of a turn in parallel and
// return all results, until it answers or we hit maxRounds (the last round disables tools).
export async function runToolLoop({ tools, messages, executeTool, maxRounds = 6, maxTokens = 16000, onEvent, json = false, systemPrompt = SYSTEM_PROMPT }) {
  const usage = emptyUsage();
  const convo = [{ role: "system", content: systemPrompt }, ...messages];
  const fnTools = tools?.length ? toFunctionTools(tools) : null;

  const request = (withTools) =>
    complete({
      model: MODEL,
      messages: convo,
      max_tokens: maxTokens,
      reasoning: { effort: REASONING_EFFORT },
      ...(fnTools ? { tools: fnTools, tool_choice: withTools ? "auto" : "none" } : {}),
      ...(json && !fnTools ? { response_format: { type: "json_object" } } : {}),
      // Only route to providers that honour every parameter we send (tools, tool_choice, response_format),
      // fastest first so multi-round agents stay inside the serverless time limit. Don't add
      // parallel_tool_calls: no gpt-oss-120b provider advertises it, so it would exclude them all.
      provider: { require_parameters: true, sort: "throughput" },
    });

  let data = await request(true);
  addUsage(usage, data);
  let rounds = 0;
  let message = data.choices?.[0]?.message;

  while (message?.tool_calls?.length && rounds < maxRounds) {
    rounds++;
    convo.push({
      role: "assistant",
      content: message.content || "",
      tool_calls: message.tool_calls,
      ...(message.reasoning_details ? { reasoning_details: message.reasoning_details } : {}),
    });
    const results = await Promise.all(message.tool_calls.map(async (call) => {
      const input = parseArgs(call.function?.arguments);
      onEvent?.({ type: "tool", name: call.function?.name, input });
      let content;
      try {
        content = JSON.stringify(await executeTool(call.function?.name, input));
      } catch (err) {
        content = JSON.stringify({ error: err.message });
      }
      return { role: "tool", tool_call_id: call.id, content };
    }));
    convo.push(...results);
    data = await request(rounds < maxRounds);
    addUsage(usage, data);
    message = data.choices?.[0]?.message;
  }

  let text = message?.content || "";
  if (json && !isValidJson(text)) {
    // Open models sometimes end a tool loop with prose or malformed JSON. One JSON-mode call
    // rewrites the draft (or, if empty, the gathered tool results) into the requested shape.
    const task = [...messages].reverse().find((m) => m.role === "user" && typeof m.content === "string")?.content || "";
    const evidence = text.trim() ? "" : convo.filter((m) => m.role === "tool").map((m) => m.content).join("\n").slice(0, 60_000);
    const repair = await complete({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Produce ONE valid JSON object that follows the output format required by the TASK. Keep every fact and sourceId from the material; invent nothing. Output only JSON.\n\nTASK:\n${task}\n\n${text.trim() ? `DRAFT ANSWER:\n${text}` : `RETRIEVED RECORDS:\n${evidence}`}`,
        },
      ],
      max_tokens: maxTokens,
      reasoning: { effort: "low" },
      response_format: { type: "json_object" },
      provider: { require_parameters: true, sort: "throughput" },
    });
    addUsage(usage, repair);
    text = repair.choices?.[0]?.message?.content || "";
  }
  if (!text.trim()) throw Object.assign(new Error("The model returned an empty answer"), { status: 502 });
  return { text, usage, rounds };
}

const isValidJson = (text) => {
  try {
    parseJson(text);
    return true;
  } catch {
    return false;
  }
};

export function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const fail = () => Object.assign(new Error("The model did not return valid JSON"), { raw: text.slice(0, 800) });
  if (start === -1 || end === -1) throw fail();
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw fail();
  }
}
