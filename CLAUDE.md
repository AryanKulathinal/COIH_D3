# COIH — Central Operational Intelligence Hub

## What This Project Is

A hackathon demo for UST's D3 Hackathon. COIH solves the "return-from-leave" problem: associates spend 3-5 hours catching up after leave. This tool does it in under 30 seconds using Claude AI.

**Problem:** 120,000-200,000 productivity hours lost annually in a 5,000-person org.
**Solution:** Connect to existing tools (email, chat, tickets, meetings, docs) → Claude AI generates a structured catch-up brief with source citations.

## Tech Stack

- **Frontend:** React 18 + Vite (no TypeScript, plain JSX)
- **Backend:** Node.js + Express (ES modules, `"type": "module"`)
- **Database:** MongoDB with Mongoose
- **AI:** Claude API via `@anthropic-ai/sdk` (Sonnet 5)
- **No TypeScript.** All files are `.js` / `.jsx`.

## Project Structure

```
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx            # Top navbar layout + routing
│   │   ├── index.css          # Global CSS — UST theme (Poppins, teal #006e74)
│   │   ├── main.jsx           # Entry point
│   │   ├── services/api.js    # All API calls to backend
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Stats overview + quick actions
│   │   │   ├── BriefPage.jsx      # Generate & view return-from-leave brief
│   │   │   ├── QAPage.jsx         # Grounded Q&A chat with citations
│   │   │   ├── CapturePage.jsx    # Knowledge capture from incidents
│   │   │   ├── InsightsPage.jsx   # Flashcards, Audio, Quiz, Infographic tabs
│   │   │   └── ConnectorsPage.jsx # Data source connectors + manual entry
│   │   └── components/
│   │       ├── Flashcards.jsx     # Flip cards for key events
│   │       ├── AudioOverview.jsx  # TTS audio briefing with SpeechSynthesis
│   │       ├── Quiz.jsx           # Multiple-choice retention quiz
│   │       └── Infographic.jsx    # Visual charts and timeline
│   └── vite.config.js         # Proxy /api → localhost:3001
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── index.js           # Server entry, route mounting
│   │   ├── seed.js            # Seed 33 demo records into MongoDB
│   │   ├── config/db.js       # Mongoose connection
│   │   ├── models/
│   │   │   ├── DataSource.js      # Email, chat, ticket, doc, meeting, calendar
│   │   │   ├── Brief.js           # Generated brief with sections
│   │   │   ├── KnowledgeEntry.js  # Captured knowledge articles
│   │   │   └── Connector.js       # Data source connector configs
│   │   ├── routes/
│   │   │   ├── api.js             # Brief, QA, capture, knowledge endpoints
│   │   │   ├── connectors.js      # CRUD for connectors and data entries
│   │   │   └── insights.js        # Flashcards, quiz, audio, infographic
│   │   └── services/
│   │       ├── claudeClient.js    # Claude SDK init, system prompt, caching, usage tracking
│   │       ├── dataAdapter.js     # MongoDB query helpers for all source types
│   │       ├── briefGenerator.js  # Multi-turn tool-use agent for brief generation
│   │       ├── qaAgent.js         # Grounded Q&A with calibrated refusal
│   │       ├── captureEngine.js   # Incident → knowledge entry conversion
│   │       ├── insightsGenerator.js # Flashcard, quiz, audio script generators
│   │       ├── mockResponses.js   # Pre-built responses for demo mode (no API key)
│   │       └── mockInsights.js    # Pre-built insights for demo mode
│   ├── .env                   # MONGODB_URI, PORT (ANTHROPIC_API_KEY optional)
│   └── .env.example
│
└── docs/Media.jpeg            # Architecture diagram
```

## How to Run

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start MongoDB (must be running on localhost:27017)
# Already running via brew services or mongod

# 3. Seed demo data
cd server && node src/seed.js

# 4. Start both (in separate terminals)
cd server && node src/index.js     # → http://localhost:3001
cd client && npx vite              # → http://localhost:5173
```

## Demo Mode vs Live Mode

The app auto-detects `ANTHROPIC_API_KEY`:
- **No key set:** Runs in DEMO mode — all Claude features return pre-built mock responses. UI shows "DEMO" badge.
- **Key set:** Runs in LIVE mode — real Claude API calls. Add to `server/.env`: `ANTHROPIC_API_KEY=sk-ant-...`

To get an API key: Sign up at console.anthropic.com (free $5 credits for new accounts).

## Design System / Theme

UST-inspired theme. All styling is in `client/src/index.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#006e74` | Brand teal — buttons, links, active states |
| `--primary-light` | `#f2f7f8` | Light teal backgrounds |
| `--bg-page` | `#f4f8f9` | Page background |
| `--bg-card` | `#ffffff` | Card backgrounds |
| `--border` | `#d7e0e3` | All borders |
| `--text-primary` | `#161617` | Headings |
| `--text-secondary` | `#707070` | Body text |
| `--text-muted` | `#a8a8a8` | Labels, hints |
| `--success` | `#01b27c` | Green — resolved, connected |
| `--error` | `#fc6a59` | Coral — incidents, errors |
| `--warning-dark` | `#a76700` | Amber — high priority, warnings |
| `--purple` | `#881e87` | Purple — documents |

- **Font:** Poppins (loaded from Google Fonts)
- **Base font-size:** 16px
- **Cards:** white bg, 1px border, border-radius 10px, shadow-sm
- **Buttons:** Primary = teal, pill shape (border-radius 9999px). Secondary = bordered, rounded 6px.
- **All sizing uses rem values.** Reference scale: headings 1rem, body 0.75rem, small 0.688rem, tiny 0.625rem.
- **Theme reference project** (for exact patterns): `/Users/196285/Documents/Dev/IJP_SO_creation/UI_new/src`

## Claude AI Architecture

### Model & Configuration
- **Model:** `claude-sonnet-5` (configured in `claudeClient.js`)
- **Thinking:** `{ type: "adaptive" }` on every call
- **Prompt Caching:** System prompt uses `cache_control: { type: "ephemeral" }` — all tool-use rounds reuse cached prefix

### Three AI Agents

**1. Brief Generator** (`briefGenerator.js`)
- 7 tools: `query_emails`, `query_chats`, `query_tickets`, `query_documents`, `query_meetings`, `query_calendar`, `get_period_stats`
- Claude autonomously decides which tools to call and in what order
- Up to 12 rounds of tool calls → synthesizes structured JSON brief
- Output: 5 sections (Decisions, Work Items, Open Questions, Incidents, Blocked Items)

**2. Q&A Agent** (`qaAgent.js`)
- 2 tools: `search_data_sources`, `search_knowledge_base`
- Every answer must cite sourceId — no hallucination
- Calibrated refusal: if insufficient evidence, refuses and names the gap
- Confidence levels: high/medium/low/none

**3. Capture Engine** (`captureEngine.js`)
- Takes an incident ID → reads incident + all related threads
- Claude generates structured knowledge entry (Problem, Root Cause, Resolution, Prevention)
- Human confirmation step before publishing
- Entry immediately queryable via Q&A agent

### Token Usage Tracking
Every Claude response tracks: `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheCreationTokens`, `estimatedCost`. Displayed in the UI.

## Key API Endpoints

| Method | Path | What it does |
|--------|------|-------------|
| POST | `/api/brief/generate` | Generate return-from-leave brief |
| GET | `/api/brief/:id` | Get a saved brief |
| POST | `/api/qa/ask` | Ask a grounded question |
| POST | `/api/capture/incident` | Capture knowledge from incident |
| POST | `/api/capture/confirm` | Confirm a draft knowledge entry |
| GET | `/api/connectors` | List all data connectors with stats |
| POST | `/api/connectors/data` | Add a data entry via UI |
| POST | `/api/insights/flashcards` | Generate flashcards |
| POST | `/api/insights/quiz` | Generate quiz questions |
| POST | `/api/insights/audio` | Generate audio briefing script |
| POST | `/api/insights/infographic` | Get infographic data |

## MongoDB Collections

- **datasources** — All ingested data (emails, chats, tickets, docs, meetings, calendar). 33 seed records.
- **briefs** — Generated leave briefs with sections and token usage.
- **knowledgeentries** — Captured knowledge articles (draft → confirmed).
- **connectors** — Data source connector configs and sync status.

## Seed Data Scenario

Demo simulates **Priya Sharma** returning from 2-week leave (Apr 1–14, 2025) on Team Alpha:
- Payment gateway migration decided (Stripe Connect over Adyen)
- P1 incident: DB connection pool exhaustion (INC-4421, resolved)
- Critical CVE patched in auth-service (jsonwebtoken)
- API rate limiting PR reassigned and design changed
- New team member Vikram Patel onboarding (starts Apr 21)
- Client dashboard demo went well, Phase 2 features requested
- Q2 SLA review upcoming (March uptime below target)

## Conventions

- Use inline styles (not CSS classes) for component-specific styling. CSS classes only for reusable patterns (.card, .btn-primary, .badge-*).
- All API calls go through `client/src/services/api.js`.
- Mock responses go in `server/src/services/mockResponses.js` and `mockInsights.js`.
- New pages: add to `client/src/pages/`, register in `App.jsx` nav + routes.
- New API routes: create in `server/src/routes/`, register in `server/src/index.js`.
- All new Claude features must work in both LIVE mode (real API) and DEMO mode (mock).
- Keep the `isLiveMode()` check in routes — never let a missing API key crash the server.

## What's Left to Build (Roadmap)

- Real OAuth connectors for Microsoft Graph / Slack / Jira APIs
- Video overview feature (animated slide deck from brief data)
- Knowledge ownership map (who knows what)
- Exit capture (when someone leaves the team)
- User authentication and multi-account support
- Streaming responses for brief generation (show progress in real-time)
- PDF export of briefs and reports
