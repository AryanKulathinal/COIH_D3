# How we used Claude Code to build COIH

COIH was designed, re-architected and built with Claude Code during the Big Build weekend. This document records which Claude Code capabilities we used and where the evidence is in the repository.

## 1. Project memory: `CLAUDE.md`

[`CLAUDE.md`](../CLAUDE.md) gives every Claude Code session the same context: the problem, architecture, folder map, run commands, demo scenario, UI theme tokens, and project rules. The rules include "grounded or silent", account-scoped data access, never exposing the API key, and one feature per commit. When the architecture changed from Express/MongoDB to Vercel + JSON, `CLAUDE.md` was rewritten in the same session so later sessions would not follow stale instructions.

## 2. Custom slash commands: `.claude/commands/`

Repeatable team workflows are encoded as project commands that anyone on the team can run:

| Command | What it does |
|---|---|
| `/setup` | Installs dependencies, checks `.env.local`, starts the API and web servers, and verifies `/api/health` |
| `/add-seed-data` | Adds synthetic records to `data/<account>/*.json` following the schema and storyline rules (e.g. INC-7310's fix must never appear in the source files) |
| `/add-feature` | Checklist for a new agent + endpoint + page (`runToolLoop`, `apiHandler`, `withFallback`, citations, theme) |
| `/add-connector` | Adds a mocked adapter and documents its production API, scope and field mapping |
| `/demo-test` | Runs every judge-facing flow (brief, grounded answer, refusal, capture loop, isolation, compare, onboarding) against local or hosted |
| `/fix-theme` | Applies the UST design tokens consistently |

## 3. Plan mode and clarifying questions

The pivot from "Express + MongoDB, demo/live toggle" to "Vercel functions + JSON seeds + localStorage + Claude only" was made in **plan mode**:

- Claude Code read the codebase and found two demo-breaking problems. Demo-mode Q&A only matched keywords to canned answers, and the only incident was already captured, so the capture loop could not be shown.
- It asked us to decide the runtime model, the personas, what to do with the out-of-scope Insights tabs, and where captured knowledge should persist.
- It wrote a plan that answered all eight of our design questions (hosted capture demo, no DB, OpenRouter vs Claude, env vars, core flows, landing page, KB connected/disconnected, RAG approach).
- We approved the plan before any code changed.

## 4. Skills

- **`claude-api` skill.** Consulted while the runtime targeted Claude (model IDs, adaptive thinking, prompt caching, `tool_choice: none` for the final synthesis round). When the team switched the runtime to OpenRouter for lack of an Anthropic API key, Claude Code checked OpenRouter's live docs (model page, usage accounting) and ported the loop without changing any agent.
- **Project skills** (the commands above) are exposed to Claude Code as skills.

## 5. Incremental, attributable commits

We asked Claude Code to **commit after each individual feature**. The history reads as a build log: scaffold → data → retrieval → Claude client → each agent → each UI page → docs. Every commit carries a `Co-Authored-By: Claude` trailer. See `git log --oneline`.

## 6. Verifying in the running app

Claude Code started the API and web servers from [`.claude/launch.json`](../.claude/launch.json) and drove the app in the built-in browser preview. It clicked through the landing page, generated a brief, opened source drawers, asked questions, and resolved INC-7310 through to publishing the knowledge entry. It checked rendered text, localStorage and the capture-rate metric (which went from 50% to 67%) instead of relying on a successful build alone. That is how the narrow-screen header issue was found and fixed (`e0eec2b`).

## 7. Tooling written by Claude Code for the team

- `scripts/dev-api.js` runs the same Vercel handlers locally with Express, so no Vercel CLI login is needed.
- `scripts/record-fallbacks.js` (`npm run record`) records every demo path from the live API, so the hosted demo survives an API outage honestly: responses are marked "recorded response" in the UI.

## 8. Review before submission

Before submitting, run `/code-review` on the full diff and `/security-review` (API key exposure, input validation, account isolation, rate limiting). Record the outcomes here.

- [ ] `/code-review`: _results_
- [ ] `/security-review`: _results_

## Claude inside the product (separate from building it)

The product runs four agents on `openai/gpt-oss-120b` via OpenRouter through a hand-written, provider-neutral tool-use loop (`lib/llm.js`). It was first built on Claude Sonnet 5 and switched in one commit (`5579a4a`) because the team had no Anthropic API key; swapping back to Claude (or Claude on Bedrock/Vertex for enterprise hosting) only touches that file.

- The loop executes each turn's tool calls **in parallel**, uses configurable **reasoning effort**, routes only to providers that support every requested parameter, disables tools on the final round so the model must synthesise an answer, and reports the real spend (`usage.cost`) for every request.
- **Brief agent:** 9 tools.
- **Q&A agent:** 4 tools, with the knowledge-base tool present only in connected mode.
- **Capture engine:** a single structured-output call.
- **Onboarding agent:** 6 tools.
