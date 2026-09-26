# COIH — How It Works (Complete Guide)

## The Problem We're Solving

Every time an associate returns from leave, they spend **3-5 hours** doing this:
1. Scrolling through hundreds of unread emails
2. Reading Slack/Teams chat threads
3. Checking Jira tickets for status changes
4. Asking colleagues "what did I miss?" (wasting their time too)
5. Figuring out what's still urgent vs. what was resolved while they were away

In a 5,000-person organization, this costs **120,000-200,000 hours per year**.

**The root cause:** The knowledge exists inside the organization — in emails, chats, tickets, meeting recordings, documents — but it's scattered across tools and not retrievable as a single coherent picture.

---

## Our Solution: Central Operational Intelligence Hub (COIH)

COIH connects to your existing tools and uses **Claude AI** to:
1. **Read** all your data sources for the leave period
2. **Synthesize** a structured brief in under 30 seconds
3. **Answer** follow-up questions with source citations
4. **Refuse** gracefully when it doesn't have evidence (no hallucination)
5. **Capture** knowledge from resolved incidents so the next person doesn't have to ask

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                       │
│                     (http://localhost:5173)                  │
│                                                             │
│  Dashboard │ Brief │ Q&A │ Knowledge │ Insights │ Connectors│
└──────────────────────────┬──────────────────────────────────┘
                           │  All calls go through
                           │  client/src/services/api.js
                           │  → proxied to localhost:3001
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND                         │
│                    (http://localhost:3001)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   ROUTE LAYER                        │    │
│  │  /api/brief/*        → Brief generation & retrieval  │    │
│  │  /api/qa/*           → Grounded Q&A                  │    │
│  │  /api/capture/*      → Knowledge capture             │    │
│  │  /api/insights/*     → Flashcards, quiz, audio, etc  │    │
│  │  /api/connectors/*   → Data source management        │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐    │
│  │              SERVICE LAYER (AI Agents)                │    │
│  │                                                      │    │
│  │  briefGenerator.js  ─── 7 tools ──→ Claude API      │    │
│  │  qaAgent.js         ─── 2 tools ──→ Claude API      │    │
│  │  captureEngine.js   ─── direct  ──→ Claude API      │    │
│  │  insightsGenerator.js── direct  ──→ Claude API      │    │
│  │                                                      │    │
│  │  claudeClient.js    ─── SDK init, caching, tracking  │    │
│  │  dataAdapter.js     ─── MongoDB query helpers        │    │
│  │                                                      │    │
│  │  mockResponses.js   ─── Demo mode (no API key)       │    │
│  │  mockInsights.js    ─── Demo mode (no API key)       │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │       MONGODB         │
        │  (localhost:27017)    │
        │                       │
        │  datasources (33)     │  ← emails, chats, tickets,
        │  briefs               │     docs, meetings, calendar
        │  knowledgeentries     │
        │  connectors (6)       │
        └───────────────────────┘
```

---

## How Each Feature Works (The Flow)

### Feature 1: Return-from-Leave Brief

This is the flagship feature. Here's exactly what happens when you click "Generate Brief":

```
Step 1: User clicks "Generate Brief"
        │
        ▼
Step 2: Frontend sends POST /api/brief/generate
        { userId: "priya.sharma", userName: "Priya Sharma",
          leaveStart: "2025-04-01", leaveEnd: "2025-04-14" }
        │
        ▼
Step 3: Server checks — is ANTHROPIC_API_KEY set?
        │
        ├─ NO  → Return pre-built mock brief (2 sec delay for realism)
        │
        └─ YES → Start the Claude AI agent loop ↓
        │
        ▼
Step 4: Server sends request to Claude API with:
        - System prompt (cached with cache_control: ephemeral)
        - 7 tool definitions (query_emails, query_chats, etc.)
        - User message: "Generate a brief for Priya, Apr 1-14"
        - thinking: { type: "adaptive" }
        │
        ▼
Step 5: Claude DECIDES which tools to call first
        (Claude is autonomous — we don't tell it the order)

        Round 1: Claude calls get_period_stats
                 → Server queries MongoDB → returns stats
                 → Server sends results back to Claude

        Round 2: Claude calls query_emails(mentionsUser=true)
                 + query_chats (parallel tool calls)
                 → Server queries MongoDB → returns matching records
                 → Server sends results back to Claude

        Round 3: Claude calls query_tickets, query_meetings
                 → Same pattern

        ... up to 12 rounds of tool calls ...

        Each round:
        ┌─────────────────────────────────────────────┐
        │  Server → Claude API (with cached system    │
        │           prompt — 90% cost savings)         │
        │  Claude → "I want to call these tools"      │
        │  Server → Executes tools against MongoDB    │
        │  Server → Sends results back to Claude      │
        │  Claude → "I need more data" or "I'm done"  │
        └─────────────────────────────────────────────┘
        │
        ▼
Step 6: Claude synthesizes ALL data into structured JSON:
        {
          overview: "During your 2-week absence...",
          sections: {
            decisions: { items: [...] },      ← with sourceId citations
            workItems: { items: [...] },      ← priority + status badges
            openQuestions: { items: [...] },   ← things awaiting your reply
            incidents: { items: [...] },       ← resolved vs open
            blockedItems: { items: [...] }     ← blocked on you
          },
          stats: { totalEmails: 9, ... }
        }
        │
        ▼
Step 7: Server saves brief to MongoDB (briefs collection)
        Server tracks token usage (input, output, cache hits, cost)
        │
        ▼
Step 8: Frontend renders the structured brief
        - Overview card with teal left border
        - Stats row (5 cards with counts)
        - Collapsible sections with badges and source links
        - Token usage displayed in top right
```

**Key Claude features used:**
- **Tool Use:** Claude has 7 tools and autonomously decides which to call
- **Prompt Caching:** System prompt is cached, so rounds 2-12 reuse it at 90% discount
- **Adaptive Thinking:** Claude decides how deeply to reason based on complexity
- **Structured Output:** Claude returns valid JSON that maps directly to the UI


### Feature 2: Grounded Q&A

```
User types: "What happened with the payment gateway?"
        │
        ▼
POST /api/qa/ask → Claude gets 2 tools:
  - search_data_sources (search by type, tags, date, user mention)
  - search_knowledge_base (search captured knowledge)
        │
        ▼
Claude decides what to search:
  Round 1: search_data_sources(tags=["payment"], sourceType="email")
  Round 2: search_data_sources(tags=["payment"], sourceType="meeting")
  Round 3: search_knowledge_base(query="payment gateway")
        │
        ▼
Claude synthesizes answer with CITATIONS:
{
  answer: "The team decided to go with Stripe Connect [email-001].
           The architecture review confirmed the approach [meet-003]...",
  confidence: "high",        ← multiple corroborating sources
  sources: [
    { sourceId: "email-001", title: "Payment Gateway Decision", snippet: "..." },
    { sourceId: "meet-003", title: "Architecture Review", snippet: "..." }
  ],
  gaps: null                  ← no missing information
}
```

**The key rule:** Every fact Claude states MUST come from a retrieved source. If it can't find evidence, it refuses rather than guessing.


### Feature 3: Calibrated Refusal

```
User asks: "What's the client's budget for next quarter?"
        │
        ▼
Claude searches all data sources → finds NOTHING about budgets
        │
        ▼
Instead of making something up, Claude returns:
{
  answer: null,              ← explicitly null, not a guess
  refusal: "I don't have sufficient evidence to answer this.
            The indexed sources contain operational data (emails,
            chats, tickets) but no financial information.",
  suggestedSources: [
    "Client contract management system",
    "Finance team or account leadership"
  ],
  confidence: "none"
}
```

**Why this matters:** This is how you build trust. The system tells you what it DOESN'T know, which is more valuable than a hallucinated answer.


### Feature 4: Knowledge Capture

```
User clicks "Capture Knowledge" on incident INC-4421
        │
        ▼
POST /api/capture/incident { incidentId: "INC-4421" }
        │
        ▼
Server finds:
  - The incident ticket (INC-4421)
  - Related emails (thread-inc-4421)
  - Related chat messages (same tags)
  - Meeting transcript (INC-4421 Hot Debrief)
  - Postmortem document
        │
        ▼
Claude reads EVERYTHING and generates:
{
  title: "Database Connection Pool Exhaustion — Batch Job Must Use Shared Pool",
  content: "**Problem:** On April 4, the orders-db connection pool was exhausted...
            **Root Cause:** Batch processor opening individual connections...
            **Resolution:** Deployed pgBouncer, fixed batch processor...
            **Prevention:** Added monitoring, ESLint rule, code review checklist...
            **If This Recurs:** Check connection count with SELECT count(*)...",
  category: "incident",
  tags: ["database", "connection-pool", "pgbouncer"],
  sources: [{ sourceId: "INC-4421" }, { sourceId: "meet-004" }, ...]
}
        │
        ▼
Entry saved as STATUS: "draft"
        │
        ▼
User reviews → clicks "Confirm & Publish"
        │
        ▼
Entry status → "confirmed"
Now immediately queryable via Q&A!
        │
        ▼
THE LOOP CLOSES: Next person who asks about connection pool issues
gets an instant answer instead of asking 3 colleagues.
```


### Feature 5: Insights (Flashcards, Audio, Quiz, Infographic)

Four alternative ways to consume the same leave period data:

```
┌─────────────────────────────────────────────────────────────┐
│                     INSIGHTS PAGE                           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Flashcards│ │  Audio   │ │   Quiz   │ │ Infographic  │   │
│  │          │ │  Brief   │ │          │ │              │   │
│  │ Click to │ │ Browser  │ │ Multiple │ │ Bar charts,  │   │
│  │ flip Q&A │ │ TTS with │ │ choice   │ │ priority     │   │
│  │ cards    │ │ playback │ │ test your│ │ breakdown,   │   │
│  │          │ │ controls │ │ catch-up │ │ timeline     │   │
│  │ Claude   │ │ Claude   │ │ Claude   │ │ Pure MongoDB │   │
│  │generated │ │generated │ │generated │ │ aggregation  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Flashcards:** 10 Q&A cards with flip animation, category + priority badges
- **Audio Brief:** Claude writes a podcast script → browser SpeechSynthesis reads it aloud with play/pause/skip controls
- **Quiz:** 8 MCQ questions testing whether you've caught up, with scoring
- **Infographic:** Activity by source, priority distribution, daily activity bar chart, key events timeline — all from MongoDB aggregation (no LLM needed)


### Feature 6: Connectors

```
┌─────────────────────────────────────────────────────────────┐
│                    CONNECTORS PAGE                          │
│                                                             │
│  ┌─ Microsoft Outlook ── Connected ── 9 items ── [Sync] ─┐ │
│  │  [+ Add Data]  [▼ Expand to see entries]               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Microsoft Teams ── Connected ── 9 items ── [Sync] ───┐ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Jira ── Connected ── 5 items ── [Sync] ──────────────┐ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Confluence ── Connected ── 3 items ── [Sync] ────────┐ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Teams Meetings ── Connected ── 4 items ── [Sync] ───┐  │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Outlook Calendar ── Connected ── 3 items ── [Sync] ──┐ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [+ Add Connector] ← Add Slack, GitHub, Datadog, etc.      │
└─────────────────────────────────────────────────────────────┘

"Add Data" opens a form tailored to each source type:
  Email  → From, To, Subject, Body, Priority, Tags
  Chat   → From, Channel, Message, Thread
  Ticket → Ticket ID, Reporter, Title, Description, Priority, Status
  Meeting→ Organizer, Attendees, Title, Full Transcript, Tags
  etc.

Anything added here → MongoDB → immediately available to Brief/Q&A/Capture
```

---

## Claude AI — How We Use It Properly

### 1. Tool Use (Function Calling)
Claude doesn't just generate text — it calls tools. We give Claude tools like `query_emails`, `search_knowledge_base`, and Claude decides when and how to call them.

```javascript
// We define tools with input schemas
const TOOLS = [{
  name: "query_emails",
  description: "Query email messages...",
  input_schema: {
    type: "object",
    properties: {
      startDate: { type: "string" },
      mentionsUser: { type: "boolean" },
    }
  }
}];

// Claude autonomously decides to call them
// Response: { stop_reason: "tool_use", content: [{ type: "tool_use", name: "query_emails", input: {...} }] }
// We execute the tool → send results back → Claude calls more tools or gives final answer
```

### 2. Prompt Caching
The system prompt is the same across all calls. We mark it with `cache_control: { type: "ephemeral" }` so Claude caches it. When the brief generator makes 8 rounds of tool calls, rounds 2-8 reuse the cached prompt at **90% cost savings**.

```javascript
export const CACHED_SYSTEM = [{
  type: "text",
  text: SYSTEM_PROMPT,
  cache_control: { type: "ephemeral" },  // ← this saves 90% on repeated calls
}];
```

### 3. Adaptive Thinking
We use `thinking: { type: "adaptive" }` on every call. Claude decides how deeply to reason based on the complexity of the question. Simple lookups = fast. Complex synthesis = deeper reasoning.

### 4. Token Usage Tracking
Every response tracks costs and displays them in the UI:
```javascript
{
  inputTokens: 12450,      // what we sent
  outputTokens: 3200,      // what Claude generated
  cacheReadTokens: 8100,   // reused from cache (cheap!)
  estimatedCost: 0.0389    // total cost in dollars
}
```

### 5. Demo Mode
When `ANTHROPIC_API_KEY` is not set, every endpoint returns pre-built mock responses. The app works identically — just with static data instead of real Claude calls.

```javascript
function isLiveMode() {
  return !!process.env.ANTHROPIC_API_KEY;
}

// In every route:
if (!isLiveMode()) {
  return res.json(MOCK_BRIEF);  // pre-built response
}
// else: real Claude API call
```

---

## Data Flow Summary

```
DATA SOURCES (seeded or added via UI)
    │
    ▼
MongoDB (datasources collection)
    │
    ├──→ Brief Generator (Claude + 7 tools) ──→ Structured Brief
    │
    ├──→ Q&A Agent (Claude + 2 tools) ──→ Grounded Answer with Citations
    │
    ├──→ Capture Engine (Claude) ──→ Knowledge Entry ──→ Back into MongoDB!
    │                                                        ↑
    │                                            THE LOOP CLOSES
    │
    ├──→ Flashcards / Quiz / Audio (Claude) ──→ Learning Materials
    │
    └──→ Infographic (MongoDB aggregation) ──→ Visual Report
```

The system gets smarter over time because captured knowledge becomes searchable by the Q&A agent.

---

## For Developers: Getting Started

```bash
# 1. Clone and install
cd server && npm install --ignore-scripts
cd ../client && npm install

# 2. Start MongoDB (must be on localhost:27017)

# 3. Seed demo data
cd server && node src/seed.js

# 4. Start server
cd server && node src/index.js

# 5. Start frontend
cd client && npx vite

# 6. Open http://localhost:5173
```

### Claude Code Slash Commands
If you're using Claude Code, these commands are pre-configured:
- `/setup` — Full setup from scratch
- `/add-feature <what>` — Add a new feature with proper patterns
- `/add-seed-data <what>` — Add more demo data
- `/add-connector <platform>` — Build a real API connector
- `/fix-theme <what>` — Fix UI styling
- `/demo-test` — Test all 5 demo scenarios

### Key Files to Know
| If you want to... | Edit this file |
|---|---|
| Change the Claude system prompt | `server/src/services/claudeClient.js` |
| Add a new tool for Claude | `server/src/services/briefGenerator.js` or `qaAgent.js` |
| Add mock data for demo mode | `server/src/services/mockResponses.js` |
| Add a new page | `client/src/pages/` + register in `App.jsx` |
| Change theme colors/fonts | `client/src/index.css` |
| Add more seed data | `server/src/seed.js` |
| Add a new API endpoint | `server/src/routes/` + register in `index.js` |
