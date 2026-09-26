import Anthropic from "@anthropic-ai/sdk";

let client = null;

export function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are the Central Operational Intelligence Hub (COIH) AI assistant for UST.
You help associates returning from leave catch up on what happened while they were away.

Your core principles:
1. GROUNDED: Every claim must be backed by a specific source. Never invent information.
2. SOURCE-BOUND: Always cite the exact source (email ID, chat message, ticket number, document title).
3. CALIBRATED REFUSAL: If you lack evidence to answer a question, say so explicitly and name the gap.
4. ACTIONABLE: Prioritize items that still need the user's attention over resolved/FYI items.
5. CONCISE: Summarize, don't repeat. The user wants a brief, not a transcript.

When generating briefs or answering questions:
- Distinguish between RESOLVED items (FYI only) and OPEN items (needs action)
- Rank by priority: critical > high > medium > low
- Always link back to source IDs so the user can drill into original threads
- If something was urgent but is now resolved, mark it clearly as resolved`;

export const CACHED_SYSTEM = [
  {
    type: "text",
    text: SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
];

export const MODEL = "claude-sonnet-5";

export function trackUsage(response) {
  const u = response.usage;
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadTokens: u.cache_read_input_tokens || 0,
    cacheCreationTokens: u.cache_creation_input_tokens || 0,
    estimatedCost: (
      (u.input_tokens * 2) / 1_000_000 +
      (u.output_tokens * 10) / 1_000_000 +
      ((u.cache_read_input_tokens || 0) * 0.2) / 1_000_000 +
      ((u.cache_creation_input_tokens || 0) * 2.5) / 1_000_000
    ),
  };
}
