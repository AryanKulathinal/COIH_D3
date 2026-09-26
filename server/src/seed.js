import "dotenv/config";
import mongoose from "mongoose";
import { DataSource } from "./models/DataSource.js";
import { KnowledgeEntry } from "./models/KnowledgeEntry.js";
import { Brief } from "./models/Brief.js";

const ACCOUNT = "demo-account";
const USER = "priya.sharma";
const LEAVE_START = new Date("2025-04-01");
const LEAVE_END = new Date("2025-04-14");

function d(dateStr) {
  return new Date(dateStr);
}

const emails = [
  {
    sourceType: "email", sourceId: "email-001", account: ACCOUNT,
    timestamp: d("2025-04-02T09:15:00Z"), from: "raj.kumar@ust.com", to: [USER, "team-alpha@ust.com"],
    subject: "RE: Payment Gateway Migration - Decision Needed",
    body: "Team, after reviewing both options, we've decided to go with Stripe Connect instead of Adyen. The integration timeline is shorter (3 weeks vs 6) and the transaction fees are comparable. Priya — when you're back, we'll need you to update the payment service adapter. CC'ing the architecture board for visibility.",
    thread: "thread-payment-migration", tags: ["payment", "architecture", "decision"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "email", sourceId: "email-002", account: ACCOUNT,
    timestamp: d("2025-04-03T11:00:00Z"), from: "sarah.chen@client.com", to: ["team-alpha@ust.com"],
    subject: "Q2 SLA Review Meeting - Rescheduled to April 18",
    body: "Hi team, the Q2 SLA review has been moved to April 18th at 2pm EST. Please prepare the uptime metrics for March. We had 99.92% uptime which is below our 99.95% target — need to discuss the two incidents from March 15 and March 28. Sarah",
    thread: "thread-sla-review", tags: ["client", "sla", "meeting"],
    priority: "medium", mentionsUser: false, requiresAction: false,
  },
  {
    sourceType: "email", sourceId: "email-003", account: ACCOUNT,
    timestamp: d("2025-04-04T14:30:00Z"), from: "mike.johnson@ust.com", to: [USER],
    subject: "FW: Prod Incident INC-4421 - Database Connection Pool Exhaustion",
    body: "Priya, FYI — we had a P1 incident on April 4th. The connection pool on the orders-db hit max connections during a traffic spike. Root cause was the new batch job that wasn't using connection pooling properly. Amit fixed it by adding pgBouncer config. Postmortem scheduled for April 16. Your input on the connection management patterns would be valuable.",
    thread: "thread-inc-4421", tags: ["incident", "database", "p1"],
    priority: "critical", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "email", sourceId: "email-004", account: ACCOUNT,
    timestamp: d("2025-04-07T08:45:00Z"), from: "hr@ust.com", to: ["all-associates@ust.com"],
    subject: "Updated Leave Policy - Effective May 1st",
    body: "Dear Associates, Please note the updated leave policy effective May 1st. Key changes: (1) Carry-forward limit increased to 10 days (2) Half-day leave now available (3) New wellness days — 2 per quarter. Full policy document attached.",
    thread: "thread-hr-policy", tags: ["hr", "policy"],
    priority: "low", mentionsUser: false, requiresAction: false,
  },
  {
    sourceType: "email", sourceId: "email-005", account: ACCOUNT,
    timestamp: d("2025-04-08T10:20:00Z"), from: "deepa.nair@ust.com", to: [USER, "team-alpha@ust.com"],
    subject: "RE: API Rate Limiting Implementation",
    body: "Priya, I've reassigned JIRA-2847 (API rate limiting) to myself since you're on leave. I've implemented the token bucket algorithm with Redis. PR #342 is up for review. Made a design change — using sliding window instead of fixed window as we discussed. Would appreciate your review when you're back since you designed the original approach.",
    thread: "thread-rate-limiting", tags: ["api", "development", "pr-review"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "email", sourceId: "email-006", account: ACCOUNT,
    timestamp: d("2025-04-09T15:10:00Z"), from: "raj.kumar@ust.com", to: ["team-alpha@ust.com"],
    subject: "Sprint 24 Retrospective Summary",
    body: "Team, Sprint 24 retro highlights: What went well: (1) Shipped user notifications on time (2) Zero critical bugs in release. What to improve: (1) Code review turnaround still slow — 2.5 days avg (2) Test coverage dropped to 72%. Action items: Raj to set up review rotation, Deepa to add coverage gates to CI pipeline.",
    thread: "thread-sprint-retro", tags: ["sprint", "retro", "process"],
    priority: "medium", mentionsUser: false, requiresAction: false,
  },
  {
    sourceType: "email", sourceId: "email-007", account: ACCOUNT,
    timestamp: d("2025-04-10T09:00:00Z"), from: "anita.desai@ust.com", to: [USER],
    subject: "Knowledge Transfer - Onboarding new team member Vikram",
    body: "Hi Priya, Vikram Patel joins our team on April 21. He'll be working on the inventory service which you own. Can you prepare a KT plan covering: (1) Service architecture (2) Deployment pipeline (3) Common failure modes (4) Key contacts at the client end. Let's schedule 3 sessions in his first week.",
    thread: "thread-onboarding-vikram", tags: ["onboarding", "kt", "team"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "email", sourceId: "email-008", account: ACCOUNT,
    timestamp: d("2025-04-11T13:45:00Z"), from: "security@ust.com", to: ["team-alpha@ust.com"],
    subject: "URGENT: CVE-2025-3102 - Critical vulnerability in jsonwebtoken library",
    body: "A critical vulnerability has been discovered in jsonwebtoken versions < 9.0.3. All teams using this library must upgrade immediately. Our scan shows team-alpha's auth-service uses version 8.5.1. Please upgrade to 9.0.3+ and redeploy by April 14. Compliance tracking ticket: SEC-891.",
    thread: "thread-security-cve", tags: ["security", "vulnerability", "urgent"],
    priority: "critical", mentionsUser: false, requiresAction: true,
    metadata: { cve: "CVE-2025-3102", affectedService: "auth-service" },
  },
  {
    sourceType: "email", sourceId: "email-009", account: ACCOUNT,
    timestamp: d("2025-04-12T10:30:00Z"), from: "amit.shah@ust.com", to: [USER, "raj.kumar@ust.com"],
    subject: "RE: Prod Incident INC-4421 - Postmortem draft",
    body: "Hi Priya and Raj, I've drafted the postmortem for INC-4421. Key findings: (1) Root cause: batch processor opening new connections per query instead of using pool (2) Impact: 45 min of degraded service, ~200 failed orders (3) Fix: pgBouncer + connection pool config (4) Prevention: add connection count monitoring alert. Draft doc linked in Confluence. Please review before the April 16 meeting.",
    thread: "thread-inc-4421", tags: ["incident", "postmortem", "database"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
];

const chats = [
  {
    sourceType: "chat", sourceId: "chat-001", account: ACCOUNT,
    timestamp: d("2025-04-02T10:30:00Z"), from: "raj.kumar", channel: "#team-alpha",
    body: "Hey team, client wants to demo the new dashboard to their CTO next Friday. @deepa.nair can you make sure the real-time charts are working with live data by Thursday?",
    thread: "thread-chat-dashboard", tags: ["client", "demo", "dashboard"],
    priority: "high", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-002", account: ACCOUNT,
    timestamp: d("2025-04-02T10:35:00Z"), from: "deepa.nair", channel: "#team-alpha",
    body: "On it! The WebSocket connection is already set up. Just need to wire the chart components to the live feed. Should be done by Wednesday.",
    thread: "thread-chat-dashboard", tags: ["dashboard", "websocket"],
    priority: "medium", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-003", account: ACCOUNT,
    timestamp: d("2025-04-03T09:00:00Z"), from: "amit.shah", channel: "#team-alpha",
    body: "Heads up — the staging environment is down. AWS is reporting an EC2 issue in us-east-1. ETA from AWS: 2 hours.",
    thread: "thread-chat-staging-down", tags: ["infra", "aws", "staging"],
    priority: "high", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-004", account: ACCOUNT,
    timestamp: d("2025-04-05T14:00:00Z"), from: "raj.kumar", channel: "#team-alpha",
    body: "@priya.sharma FYI - I've escalated JIRA-2901 to you. Client reported intermittent 504s on the inventory API. Looks like it might be related to the cache invalidation logic you implemented. Can you take a look when you're back?",
    thread: "thread-chat-504s", tags: ["bug", "inventory", "escalation"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "chat", sourceId: "chat-005", account: ACCOUNT,
    timestamp: d("2025-04-07T11:20:00Z"), from: "deepa.nair", channel: "#team-alpha",
    body: "Dashboard demo went great! Client CTO loved the real-time analytics. They want to add predictive inventory alerts as a Phase 2 feature. @raj.kumar can you add this to the backlog?",
    thread: "thread-chat-dashboard", tags: ["client", "demo", "success"],
    priority: "medium", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-006", account: ACCOUNT,
    timestamp: d("2025-04-08T16:45:00Z"), from: "amit.shah", channel: "#incidents",
    body: "INC-4421 RESOLVED. Connection pool exhaustion fixed. pgBouncer deployed to prod. Monitoring confirms stable connections at ~60% pool utilization. Full RCA in the postmortem doc.",
    thread: "thread-chat-inc-4421", tags: ["incident", "resolved"],
    priority: "high", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-007", account: ACCOUNT,
    timestamp: d("2025-04-10T09:30:00Z"), from: "raj.kumar", channel: "#team-alpha",
    body: "Team standup notes: Sprint 25 started. Key items: (1) Payment gateway migration kickoff (2) API rate limiting PR needs review (3) Security CVE patch for auth-service. @priya.sharma has 3 items waiting for her return.",
    thread: "thread-chat-standup", tags: ["standup", "sprint"],
    priority: "medium", mentionsUser: true,
  },
  {
    sourceType: "chat", sourceId: "chat-008", account: ACCOUNT,
    timestamp: d("2025-04-11T14:00:00Z"), from: "deepa.nair", channel: "#team-alpha",
    body: "I've patched the jsonwebtoken CVE in auth-service. PR #345 is merged and deployed to staging. Production deploy scheduled for tomorrow morning. @amit.shah can you monitor after deploy?",
    thread: "thread-chat-cve-fix", tags: ["security", "deployment"],
    priority: "high", mentionsUser: false,
  },
  {
    sourceType: "chat", sourceId: "chat-009", account: ACCOUNT,
    timestamp: d("2025-04-13T10:00:00Z"), from: "amit.shah", channel: "#team-alpha",
    body: "CVE patch deployed to prod successfully. All auth flows verified. No issues reported. SEC-891 marked as resolved.",
    thread: "thread-chat-cve-fix", tags: ["security", "resolved"],
    priority: "medium", mentionsUser: false,
  },
];

const tickets = [
  {
    sourceType: "ticket", sourceId: "JIRA-2847", account: ACCOUNT,
    timestamp: d("2025-04-08T10:00:00Z"), from: "deepa.nair",
    subject: "Implement API Rate Limiting",
    body: "Status: In Review. Implemented token bucket rate limiting with Redis backend. Sliding window approach (changed from fixed window). PR #342 ready for review. Assignee changed from priya.sharma to deepa.nair during leave.",
    tags: ["api", "rate-limiting", "in-review"],
    priority: "high", status: "open", mentionsUser: true, requiresAction: true,
    metadata: { assignee: "deepa.nair", originalAssignee: "priya.sharma", pr: "#342" },
  },
  {
    sourceType: "ticket", sourceId: "JIRA-2901", account: ACCOUNT,
    timestamp: d("2025-04-05T14:30:00Z"), from: "raj.kumar",
    subject: "Intermittent 504s on Inventory API",
    body: "Client reported intermittent 504 timeout errors on inventory API endpoints. Seems to happen during peak hours (2-4pm EST). Suspected relation to cache invalidation logic. Escalated to Priya. Priority: High.",
    tags: ["bug", "inventory", "client-reported"],
    priority: "high", status: "open", mentionsUser: true, requiresAction: true,
    metadata: { assignee: "priya.sharma", reporter: "client" },
  },
  {
    sourceType: "ticket", sourceId: "JIRA-2910", account: ACCOUNT,
    timestamp: d("2025-04-09T09:00:00Z"), from: "raj.kumar",
    subject: "Payment Gateway Migration - Stripe Connect Integration",
    body: "New epic: Migrate from legacy payment processor to Stripe Connect. Estimated effort: 3 sprints. Key tasks: (1) Stripe SDK integration (2) Payment service adapter update (3) Webhook handlers (4) Testing with sandbox. Priya to lead the adapter work.",
    tags: ["payment", "migration", "epic"],
    priority: "high", status: "open", mentionsUser: true, requiresAction: true,
    metadata: { assignee: "priya.sharma", epic: "Payment Migration" },
  },
  {
    sourceType: "ticket", sourceId: "SEC-891", account: ACCOUNT,
    timestamp: d("2025-04-11T08:00:00Z"), from: "security@ust.com",
    subject: "CVE-2025-3102 - jsonwebtoken upgrade",
    body: "Critical security vulnerability in jsonwebtoken < 9.0.3. Auth-service upgraded and deployed to production. Verified by Amit Shah on April 13. No exploitation detected.",
    tags: ["security", "cve", "resolved"],
    priority: "critical", status: "resolved",
    metadata: { resolvedBy: "deepa.nair", verifiedBy: "amit.shah" },
  },
  {
    sourceType: "ticket", sourceId: "INC-4421", account: ACCOUNT,
    timestamp: d("2025-04-04T14:00:00Z"), from: "monitoring-bot",
    subject: "P1: Database Connection Pool Exhaustion - orders-db",
    body: "Incident: Connection pool on orders-db reached maximum (100 connections). Impact: 45 minutes of degraded service, ~200 failed order transactions. Root cause: New batch processor opening individual connections instead of using pool. Resolution: Deployed pgBouncer, fixed batch processor connection handling. Postmortem scheduled April 16.",
    tags: ["incident", "database", "p1", "resolved"],
    priority: "critical", status: "resolved",
    metadata: { resolvedBy: "amit.shah", impactDuration: "45 minutes", affectedOrders: 200 },
  },
];

const documents = [
  {
    sourceType: "document", sourceId: "doc-001", account: ACCOUNT,
    timestamp: d("2025-04-09T12:00:00Z"), from: "raj.kumar",
    subject: "Architecture Decision Record - Payment Gateway Selection",
    body: "ADR-015: Selected Stripe Connect over Adyen for payment gateway migration. Decision factors: (1) Integration timeline: Stripe 3 weeks vs Adyen 6 weeks (2) SDK quality: Stripe's Node.js SDK is more mature (3) Transaction fees: comparable at our volume (4) Client preference: neutral. Trade-offs: Stripe has fewer payment methods in APAC region. Mitigation: Phase 2 will add local payment methods via Stripe's expanding coverage.",
    tags: ["adr", "architecture", "payment"],
    priority: "high",
  },
  {
    sourceType: "document", sourceId: "doc-002", account: ACCOUNT,
    timestamp: d("2025-04-12T11:00:00Z"), from: "amit.shah",
    subject: "Postmortem Draft - INC-4421 Connection Pool Exhaustion",
    body: "Incident Summary: On April 4, 2025, the orders-db connection pool was exhausted during a traffic spike coinciding with the new batch job execution. Timeline: 14:00 - Batch job started, 14:15 - Connection count exceeded threshold, 14:20 - Alerts fired, 14:25 - Amit Shah engaged, 14:45 - pgBouncer deployed as interim fix, 15:00 - Service restored. Root Cause: The batch processor was creating new database connections per query rather than using the connection pool. Prevention: (1) Add connection count monitoring with alerting at 80% threshold (2) Mandatory connection pool usage in code review checklist (3) Load testing for new batch jobs before prod deployment.",
    tags: ["postmortem", "incident", "database"],
    priority: "high",
  },
  {
    sourceType: "document", sourceId: "doc-003", account: ACCOUNT,
    timestamp: d("2025-04-10T14:00:00Z"), from: "deepa.nair",
    subject: "Technical Design - API Rate Limiting",
    body: "Design doc for JIRA-2847. Approach: Token bucket algorithm with Redis backend. Changed from fixed window to sliding window after analysis showed fixed window allows burst traffic at window boundaries. Configuration: 100 requests/minute for standard tier, 1000/minute for premium. Redis key pattern: rate:{userId}:{endpoint}. Fallback: In-memory rate limiting if Redis is unavailable. Monitoring: Grafana dashboard with rate limit hit metrics per endpoint.",
    tags: ["design", "api", "rate-limiting"],
    priority: "medium",
  },
];

const meetings = [
  {
    sourceType: "meeting", sourceId: "meet-001", account: ACCOUNT,
    timestamp: d("2025-04-03T10:00:00Z"), from: "raj.kumar",
    to: ["deepa.nair", "amit.shah", "anita.desai@ust.com"],
    subject: "Sprint 24 Planning - Team Alpha",
    body: `MEETING TRANSCRIPT (Auto-generated from Teams recording)
Duration: 45 minutes | Attendees: Raj Kumar, Deepa Nair, Amit Shah, Anita Desai

[00:02] Raj: Let's start with the sprint review. Priya is on leave so I'll cover her items. The payment gateway decision is finalized — we're going with Stripe Connect.

[00:05] Deepa: I can pick up the API rate limiting ticket JIRA-2847 while Priya is away. I was thinking of changing the approach from fixed window to sliding window — fixed window has a burst problem at boundaries.

[00:08] Raj: Good call. Make sure to document the design change so Priya can review when she's back.

[00:12] Amit: Quick update on infra — we're seeing some connection pool pressure on orders-db during peak hours. I'm monitoring it but we might need to add pgBouncer.

[00:15] Raj: Keep an eye on it. If it gets worse, page me.

[00:20] Anita: New joiner update — Vikram Patel is confirmed to start April 21. He'll be on inventory service, which is Priya's domain. We need to plan KT sessions.

[00:25] Raj: Let's block 3 sessions in Vikram's first week. Priya, Amit, and I will split the topics.

[00:30] Deepa: Client demo for the dashboard is Friday. The real-time charts are almost ready — just need to wire WebSocket to live data feed.

[00:35] Raj: Priority for this week: (1) Dashboard demo prep (2) Rate limiting PR (3) Monitor db connections. Let's sync daily on the dashboard progress.

ACTION ITEMS:
- Deepa: Pick up JIRA-2847, change to sliding window approach
- Amit: Monitor orders-db connection pool, add pgBouncer if needed
- Raj: Plan KT sessions for Vikram
- Deepa: Complete dashboard charts for Friday demo`,
    tags: ["sprint-planning", "meeting", "decisions", "action-items"],
    priority: "high", mentionsUser: true,
    metadata: { duration: "45 min", platform: "Microsoft Teams", recordingUrl: "https://teams.microsoft.com/recording/meet-001", hasVideo: true },
  },
  {
    sourceType: "meeting", sourceId: "meet-002", account: ACCOUNT,
    timestamp: d("2025-04-07T14:00:00Z"), from: "raj.kumar",
    to: ["deepa.nair", "amit.shah", "sarah.chen@client.com"],
    subject: "Client Dashboard Demo - Debrief",
    body: `MEETING TRANSCRIPT (Auto-generated from Teams recording)
Duration: 30 minutes | Attendees: Raj Kumar, Deepa Nair, Amit Shah, Sarah Chen (Client)

[00:02] Raj: Great demo today. Sarah, any initial feedback from the CTO?

[00:04] Sarah: He loved the real-time analytics view. Two requests: (1) Can we add predictive inventory alerts? Like "based on current trends, SKU X will be out of stock in 3 days." (2) Can we get an export-to-PDF feature for the monthly reports?

[00:08] Deepa: Predictive alerts would need a forecasting model. We could start with a simple moving average and iterate. I'd estimate 2-3 sprints for a solid v1.

[00:12] Raj: Let's add it to the Phase 2 backlog. Sarah, we'll scope it formally and get back to you by end of next week.

[00:15] Sarah: Perfect. Also, reminder that the Q2 SLA review is April 18. We need to discuss the March incidents — uptime was 99.92% versus our 99.95% target.

[00:20] Amit: I'm preparing the incident report. The two downtimes were the auth-service blip on March 15 (3 minutes) and the DNS issue on March 28 (12 minutes). Both have been addressed.

[00:25] Raj: Good. Let's have a prep meeting on April 17 to rehearse. We need a solid improvement plan to present.

ACTION ITEMS:
- Raj: Add predictive alerts to Phase 2 backlog, send scope estimate to Sarah by April 14
- Deepa: Research forecasting approaches for inventory alerts
- Amit: Prepare March incident report for SLA review
- Raj: Schedule SLA prep meeting for April 17`,
    tags: ["client", "demo", "dashboard", "feedback", "action-items"],
    priority: "high", mentionsUser: false,
    metadata: { duration: "30 min", platform: "Microsoft Teams", recordingUrl: "https://teams.microsoft.com/recording/meet-002", hasVideo: true },
  },
  {
    sourceType: "meeting", sourceId: "meet-003", account: ACCOUNT,
    timestamp: d("2025-04-09T11:00:00Z"), from: "raj.kumar",
    to: ["deepa.nair", "amit.shah"],
    subject: "Architecture Review - Payment Gateway Migration",
    body: `MEETING TRANSCRIPT (Auto-generated from Zoom recording)
Duration: 60 minutes | Attendees: Raj Kumar, Deepa Nair, Amit Shah

[00:03] Raj: Today we're finalizing the architecture for the Stripe Connect migration. I've documented the decision in ADR-015. Let's walk through the integration plan.

[00:08] Amit: I've reviewed the Stripe SDK. Their Node.js library is solid. We need to handle: (1) Payment intents for one-time charges (2) Subscription management (3) Webhook handlers for async events like disputes and refunds.

[00:15] Raj: What about the adapter pattern? Priya designed the current payment service adapter — we need to keep the same interface so upstream services aren't affected.

[00:18] Deepa: I looked at the current adapter. It has 4 main methods: createPayment, getPaymentStatus, refundPayment, and listTransactions. We should be able to swap the implementation behind those interfaces without touching callers.

[00:25] Raj: Good. Priya will lead the adapter work when she's back. Amit, can you start on the webhook handlers this sprint? Those are independent of the adapter.

[00:30] Amit: Sure. I'll set up the webhook endpoint with signature verification. We need a dead letter queue for failed webhook processing.

[00:40] Raj: Testing strategy — we'll use Stripe's sandbox environment. Let's also add integration tests that run against the sandbox in CI.

[00:50] Deepa: One risk: Stripe has fewer payment methods in APAC compared to Adyen. Should we flag this to the client?

[00:53] Raj: Good point. I'll add it to the ADR as a known trade-off. Stripe is expanding APAC coverage, so Phase 2 can address this.

DECISIONS:
- Keep the existing adapter interface (createPayment, getPaymentStatus, refundPayment, listTransactions)
- Amit starts webhook handlers this sprint, Priya leads adapter swap when back
- Use Stripe sandbox for testing, add integration tests to CI
- APAC payment method gap accepted as known trade-off, addressed in Phase 2

ACTION ITEMS:
- Amit: Set up Stripe webhook endpoint with signature verification + DLQ
- Priya (when back): Lead payment adapter implementation, swap behind existing interface
- Raj: Update ADR-015 with APAC trade-off, flag to client
- Deepa: Add Stripe sandbox integration tests to CI pipeline`,
    tags: ["architecture", "payment", "stripe", "decisions", "migration"],
    priority: "high", mentionsUser: true, requiresAction: true,
    metadata: { duration: "60 min", platform: "Zoom", recordingUrl: "https://zoom.us/recording/meet-003", hasVideo: true },
  },
  {
    sourceType: "meeting", sourceId: "meet-004", account: ACCOUNT,
    timestamp: d("2025-04-11T09:30:00Z"), from: "amit.shah",
    to: ["raj.kumar", "deepa.nair"],
    subject: "Incident INC-4421 Hot Debrief",
    body: `MEETING TRANSCRIPT (Auto-generated from Teams recording)
Duration: 25 minutes | Attendees: Amit Shah, Raj Kumar, Deepa Nair

[00:02] Amit: Quick debrief on the connection pool incident from April 4. I've stabilized it with pgBouncer but want to walk through what happened.

[00:05] Amit: The new batch job for order reconciliation was opening a fresh DB connection for every single query. During peak traffic at 2pm, this pushed us past the 100-connection limit. 45 minutes of degraded service, about 200 failed orders.

[00:10] Raj: How did we miss this in code review?

[00:12] Amit: The batch job was reviewed but the reviewer didn't catch that it was using the raw pg client instead of our pool wrapper. We need a lint rule or code review checklist item for this.

[00:15] Deepa: I can add a custom ESLint rule that flags direct pg.Client usage outside the pool module.

[00:18] Raj: Good. Also, we need Priya's input on the connection management patterns for the postmortem. She designed the pool wrapper originally.

[00:22] Amit: I'll write up the full postmortem draft and schedule the review for April 16. Priya should be back by then.

ACTION ITEMS:
- Amit: Write postmortem draft, schedule April 16 review
- Deepa: Create ESLint rule for direct pg.Client usage detection
- Raj: Add "connection pool usage" to code review checklist
- Priya (when back): Review postmortem, advise on connection management patterns`,
    tags: ["incident", "postmortem", "database", "debrief"],
    priority: "high", mentionsUser: true, requiresAction: true,
    metadata: { duration: "25 min", platform: "Microsoft Teams", recordingUrl: "https://teams.microsoft.com/recording/meet-004", hasVideo: true },
  },
];

const calendarEvents = [
  {
    sourceType: "calendar", sourceId: "cal-001", account: ACCOUNT,
    timestamp: d("2025-04-16T10:00:00Z"), from: "raj.kumar", to: [USER, "amit.shah"],
    subject: "INC-4421 Postmortem Review",
    body: "Postmortem review for the database connection pool incident. Priya's input requested on connection management best practices. Duration: 1 hour.",
    tags: ["meeting", "postmortem"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
  {
    sourceType: "calendar", sourceId: "cal-002", account: ACCOUNT,
    timestamp: d("2025-04-18T14:00:00Z"), from: "sarah.chen@client.com", to: ["team-alpha@ust.com"],
    subject: "Q2 SLA Review with Client",
    body: "Quarterly SLA review. Agenda: March uptime metrics (99.92% vs 99.95% target), incident review, improvement plan. Duration: 1.5 hours.",
    tags: ["meeting", "client", "sla"],
    priority: "high", mentionsUser: false,
  },
  {
    sourceType: "calendar", sourceId: "cal-003", account: ACCOUNT,
    timestamp: d("2025-04-21T09:00:00Z"), from: "anita.desai@ust.com", to: [USER, "vikram.patel@ust.com"],
    subject: "KT Session 1 - Inventory Service Architecture",
    body: "First knowledge transfer session for Vikram Patel. Priya to walk through service architecture, deployment pipeline, and key integration points. Duration: 2 hours.",
    tags: ["meeting", "onboarding", "kt"],
    priority: "high", mentionsUser: true, requiresAction: true,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/coih";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await DataSource.deleteMany({ account: ACCOUNT });
  await KnowledgeEntry.deleteMany({ account: ACCOUNT });
  await Brief.deleteMany({ account: ACCOUNT });

  const allData = [...emails, ...chats, ...tickets, ...documents, ...meetings, ...calendarEvents];
  await DataSource.insertMany(allData);
  console.log(`Seeded ${allData.length} data source records`);

  await KnowledgeEntry.create({
    title: "Orders DB Connection Pool Configuration",
    content: "The orders-db PostgreSQL instance uses a connection pool with max 100 connections. For batch jobs, always use the shared pool via the db.getPool() helper — never open individual connections. pgBouncer is deployed as a connection pooler in front of the database. Alert threshold is set at 80% utilization.",
    account: ACCOUNT,
    category: "troubleshooting",
    sources: [{ sourceId: "INC-4421", sourceType: "ticket", title: "P1: Connection Pool Exhaustion" }],
    tags: ["database", "connection-pool", "pgbouncer", "orders-db"],
    createdBy: "system",
    status: "confirmed",
    provenance: { capturedFrom: "INC-4421", capturedAt: new Date(), lastVerified: new Date() },
  });
  console.log("Seeded 1 knowledge entry");

  await mongoose.disconnect();
  console.log("Seed complete!");
}

seed().catch(console.error);
