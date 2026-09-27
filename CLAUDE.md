# COIH — Central Operational Intelligence Hub

## What This Project Is

A hackathon prototype for UST's D3 "Fix It Forward with Claude" hackathon (submission due 28 Sep 2026, 9:00 AM IST). COIH is a per-account knowledge layer that (1) answers operational questions grounded strictly in the account's own artifacts, with a source on every claim, and (2) captures new knowledge automatically from resolved incidents. Headline use case: the return-from-leave brief (3–5 h manual catch-up → under a minute).

Scoring: Business Impact 40 · Technical Feasibility 30 · Claude Code Usage 20 · Presentation 10.

## Tech Stack

- **Frontend:** React 18 + Vite, plain JSX (no TypeScript), `client/`
- **Backend:** Vercel serverless functions (Node, ES modules), `api/` + shared `lib/`
- **Data:** synthetic JSON seed files per account in `data/` — **no database**. Captured knowledge is stored in the browser (localStorage) and sent with each request.
- **Retrieval:** MiniSearch (BM25-style lexical index) exposed to Claude as tools — agentic retrieval, not vector RAG
- **AI:** `openai/gpt-oss-120b` via OpenRouter (OpenAI-compatible Chat Completions, plain `fetch`), reasoning effort, manual parallel tool-use loop, real cost from `usage.cost`. Provider-neutral layer in `lib/llm.js`. (Switched from Claude because the team has no Anthropic API key; the app is built with Claude Code.)
- **Hosting:** Vercel (static client + functions). `OPENROUTER_API_KEY` is a Vercel env var, read only server-side.

## Project Structure

```
├── api/                      # Vercel functions (POST only, wrapped by lib/guard.js)
│   ├── ask.js                # Grounded Q&A (kbMode connected | disconnected = same model, no account data, no tools — the comparison baseline)
│   ├── brief.js              # Return-from-leave brief, streams NDJSON progress
│   ├── capture.js            # Resolved incident → KB draft
│   ├── onboarding.js         # New-joiner path + knowledge-ownership map
│   └── health.js
├── lib/
│   ├── llm.js                # OpenRouter client, system prompt, runToolLoop, usage/cost, parseJson
│   ├── store.js              # Account-scoped JSON adapter + sanitiseEntries (isolation)
│   ├── search.js             # MiniSearch indexes (swap point for vector/hybrid search)
│   ├── guard.js              # apiHandler, rate limit, input caps, recorded fallbacks
│   └── agents/{qa,brief,capture,onboarding}.js
├── data/
│   ├── accounts.json         # Accounts, personas, suggested questions, checklists, demo prefill
│   ├── alpha/*.json          # Helix Retail: emails, chats, tickets, incidents, documents, meetings, calendar, knowledge, people
│   ├── beta/*.json           # Meridian Freight (same files)
│   └── <account>/fallbacks/  # Recorded live responses (npm run record)
├── client/src/
│   ├── App.jsx               # Landing gate, shell, nav, persona switcher, routes
│   ├── data.js               # Browser view of the same seed JSON (via @data alias)
│   ├── context/SessionContext.jsx  # persona, captured KB, incident state, progress, cache, resetDemo
│   ├── services/api.js       # All API calls (incl. NDJSON stream reader)
│   ├── pages/                # Landing, Dashboard (Home), BriefPage, QAPage, IncidentsPage, KnowledgePage, OnboardingPage, ConnectorsPage
│   └── components/           # SourceDrawer (SourceChip, CitedText), AnswerCard, RunMeta, GuidedDemo
├── scripts/
│   ├── dev-api.js            # Local stand-in for Vercel: mounts api/*.js on :3001
│   └── record-fallbacks.js   # Records every demo path from the live API
└── docs/                     # INTEGRATIONS.md, CLAUDE_CODE_USAGE.md, architecture
```

## How to Run

```bash
npm run install:all          # root + client deps
cp .env.example .env.local   # add OPENROUTER_API_KEY
npm run dev                  # API :3001 + web :5173 (Vite proxies /api)
npm run record               # optional: refresh recorded fallbacks (a few cents)
```

Deploy: import the repo in Vercel (build/output come from `vercel.json`), set `OPENROUTER_API_KEY`, deploy.

## Demo Scenario (3 personas, 2 isolated accounts)

- **Priya Sharma** (Alpha, Helix Retail) — back from leave Apr 1–14 2025 → Return brief, grounded Q&A, refusal (Q3 budget)
- **Vikram Patel** (Alpha) — new joiner Apr 21 → Onboarding path + ownership map, Compare raw vs knowledge layer
- **Meera Iyer** (Beta, Meridian Freight) — live P2 INC-7310 (FastShip 429s) → ask (refused) → resolve → auto-capture → ask again (answered) → isolation check (INC-4421 refused)

The INC-7310 fix deliberately exists only in `data/accounts.json → demo.resolutionPrefill`, never in source files.

## Conventions

- **Commit one feature/change at a time** (history is evidence for the Claude Code score).
- Inline styles for component-specific styling; CSS classes only for reusable patterns (.card, .btn-*, .badge-*). Rem sizes: headings 1rem, body 0.75rem, small 0.688rem, tiny 0.625rem. Theme tokens in `client/src/index.css` (teal `#006e74`, Poppins).
- All model calls go through `lib/llm.js` (`runToolLoop`); all data access through `lib/store.js` with an explicit `account`.
- Every new API route uses `apiHandler` and `withFallback`; add its path to `scripts/record-fallbacks.js`.
- Never expose the API key to the client (no `VITE_` prefix). Synthetic data only; no live production integrations.
- Grounded or silent: cite sourceIds / KB ids; refuse and name the gap and a person when evidence is missing.

## Roadmap (not in the prototype)

Real OAuth adapters (Graph, Slack, Jira, PagerDuty), server-side account index (replacing localStorage), vector/hybrid retrieval behind `lib/search.js`, entitlement-aware retrieval, exit capture, guided incident triage, delivery of the brief into Teams.
