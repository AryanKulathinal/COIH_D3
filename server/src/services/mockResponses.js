export const MOCK_BRIEF = {
  overview: "During your 2-week absence (Apr 1–14), the team made a major architecture decision to adopt Stripe Connect for the payment gateway migration, handled a P1 database incident (INC-4421, now resolved), patched a critical security CVE in the auth-service, and reassigned your API rate limiting work to Deepa. You have 8 items requiring your attention, including 3 upcoming meetings and a new team member onboarding.",
  stats: {
    totalEmails: 9,
    totalChats: 9,
    totalTickets: 5,
    totalMeetings: 4,
    keyDecisions: 5,
    actionItems: 8,
  },
  sections: {
    decisions: {
      title: "Key Decisions Made",
      items: [
        {
          summary: "Payment gateway migration: Stripe Connect selected over Adyen",
          detail: "The team evaluated both options and chose Stripe Connect due to shorter integration timeline (3 weeks vs 6) and mature Node.js SDK. APAC payment method gap accepted as Phase 2 trade-off. You will lead the adapter implementation.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "email-001", sourceType: "email", title: "Payment Gateway Migration - Decision Needed", snippet: "we've decided to go with Stripe Connect instead of Adyen" },
            { sourceId: "doc-001", sourceType: "document", title: "ADR-015: Payment Gateway Selection", snippet: "Integration timeline: Stripe 3 weeks vs Adyen 6 weeks" },
            { sourceId: "meet-003", sourceType: "meeting", title: "Architecture Review - Payment Gateway Migration", snippet: "Keep existing adapter interface, Priya leads adapter swap when back" },
          ],
        },
        {
          summary: "API rate limiting changed from fixed window to sliding window",
          detail: "Deepa took over JIRA-2847 and changed the algorithm to sliding window with Redis backend, addressing burst traffic at window boundaries. PR #342 is ready for your review.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "email-005", sourceType: "email", title: "API Rate Limiting Implementation", snippet: "using sliding window instead of fixed window as we discussed" },
            { sourceId: "doc-003", sourceType: "document", title: "Technical Design - API Rate Limiting", snippet: "sliding window after analysis showed fixed window allows burst traffic" },
            { sourceId: "meet-001", sourceType: "meeting", title: "Sprint 24 Planning", snippet: "Deepa: I was thinking of changing the approach from fixed window to sliding window" },
          ],
        },
        {
          summary: "Client wants predictive inventory alerts added as Phase 2 feature",
          detail: "Dashboard demo went well. Client CTO requested predictive alerts ('SKU X will be out of stock in 3 days') and PDF export for monthly reports. Raj is scoping the work.",
          priority: "medium",
          status: "fyi",
          sources: [
            { sourceId: "chat-005", sourceType: "chat", title: "Dashboard demo feedback", snippet: "They want to add predictive inventory alerts as a Phase 2 feature" },
            { sourceId: "meet-002", sourceType: "meeting", title: "Client Dashboard Demo Debrief", snippet: "Can we add predictive inventory alerts? Like 'based on current trends, SKU X will be out of stock in 3 days'" },
          ],
        },
      ],
    },
    workItems: {
      title: "Your Work Items",
      items: [
        {
          summary: "Lead Stripe Connect payment adapter implementation",
          detail: "New epic JIRA-2910 created. Key tasks: Stripe SDK integration, payment service adapter update (keep existing interface: createPayment, getPaymentStatus, refundPayment, listTransactions), webhook handlers, sandbox testing. Estimated 3 sprints.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "JIRA-2910", sourceType: "ticket", title: "Payment Gateway Migration - Stripe Connect", snippet: "Priya to lead the adapter work" },
            { sourceId: "meet-003", sourceType: "meeting", title: "Architecture Review", snippet: "Priya will lead the adapter work when she's back" },
          ],
        },
        {
          summary: "Review PR #342 — API rate limiting (sliding window approach)",
          detail: "Deepa reassigned JIRA-2847 to herself and implemented token bucket with Redis. Design changed from your original fixed-window approach to sliding window. She requests your review since you designed the original.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "JIRA-2847", sourceType: "ticket", title: "Implement API Rate Limiting", snippet: "PR #342 ready for review. Assignee changed from priya.sharma to deepa.nair" },
            { sourceId: "email-005", sourceType: "email", title: "API Rate Limiting Implementation", snippet: "Would appreciate your review when you're back since you designed the original approach" },
          ],
        },
        {
          summary: "Investigate intermittent 504s on Inventory API",
          detail: "Client reported timeouts during peak hours (2-4pm EST). Suspected relation to your cache invalidation logic. Escalated to you via JIRA-2901.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "JIRA-2901", sourceType: "ticket", title: "Intermittent 504s on Inventory API", snippet: "Suspected relation to cache invalidation logic. Escalated to Priya" },
            { sourceId: "chat-004", sourceType: "chat", title: "504 escalation", snippet: "Looks like it might be related to the cache invalidation logic you implemented" },
          ],
        },
        {
          summary: "Prepare KT plan for new team member Vikram Patel (starts Apr 21)",
          detail: "Cover: service architecture, deployment pipeline, common failure modes, key client contacts. 3 sessions planned for his first week on inventory service.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "email-007", sourceType: "email", title: "Knowledge Transfer - Onboarding Vikram", snippet: "Can you prepare a KT plan" },
            { sourceId: "meet-001", sourceType: "meeting", title: "Sprint 24 Planning", snippet: "Vikram Patel is confirmed to start April 21. He'll be on inventory service" },
          ],
        },
      ],
    },
    openQuestions: {
      title: "Threads Awaiting Your Response",
      items: [
        {
          summary: "Review INC-4421 postmortem draft before April 16 meeting",
          detail: "Amit drafted the postmortem for the connection pool incident. Your input is requested on connection management patterns since you designed the pool wrapper.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "email-009", sourceType: "email", title: "Postmortem draft", snippet: "Please review before the April 16 meeting" },
            { sourceId: "meet-004", sourceType: "meeting", title: "INC-4421 Hot Debrief", snippet: "We need Priya's input on the connection management patterns" },
          ],
        },
        {
          summary: "Prepare uptime metrics for Q2 SLA Review (April 18)",
          detail: "March uptime was 99.92% vs 99.95% target. Two incidents to discuss. Amit is preparing the incident report.",
          priority: "medium",
          status: "needs_action",
          sources: [
            { sourceId: "email-002", sourceType: "email", title: "Q2 SLA Review Meeting", snippet: "99.92% uptime which is below our 99.95% target" },
            { sourceId: "meet-002", sourceType: "meeting", title: "Client Dashboard Demo Debrief", snippet: "Q2 SLA review is April 18. We need to discuss the March incidents" },
          ],
        },
      ],
    },
    incidents: {
      title: "Incidents in Your Components",
      items: [
        {
          summary: "P1: Database connection pool exhaustion on orders-db (RESOLVED)",
          detail: "April 4 — batch processor opened individual connections instead of using pool, hitting 100-connection limit. 45 min degraded service, ~200 failed orders. Amit fixed with pgBouncer. Postmortem on April 16 — your review requested.",
          priority: "critical",
          status: "resolved",
          sources: [
            { sourceId: "INC-4421", sourceType: "ticket", title: "P1: Connection Pool Exhaustion", snippet: "45 minutes of degraded service, ~200 failed order transactions" },
            { sourceId: "email-003", sourceType: "email", title: "Prod Incident INC-4421", snippet: "connection pool on the orders-db hit max connections" },
            { sourceId: "meet-004", sourceType: "meeting", title: "INC-4421 Hot Debrief", snippet: "batch job was opening a fresh DB connection for every single query" },
          ],
        },
        {
          summary: "Critical CVE-2025-3102 in jsonwebtoken patched (RESOLVED)",
          detail: "Auth-service was using vulnerable version 8.5.1. Deepa upgraded to 9.0.3+, deployed to prod April 13. Verified by Amit, SEC-891 closed.",
          priority: "critical",
          status: "resolved",
          sources: [
            { sourceId: "email-008", sourceType: "email", title: "CVE-2025-3102", snippet: "Critical vulnerability in jsonwebtoken versions < 9.0.3" },
            { sourceId: "SEC-891", sourceType: "ticket", title: "CVE patch", snippet: "Upgraded and deployed. No exploitation detected" },
            { sourceId: "chat-009", sourceType: "chat", title: "CVE patch deployed", snippet: "All auth flows verified. No issues reported" },
          ],
        },
      ],
    },
    blockedItems: {
      title: "Items Blocked on You",
      items: [
        {
          summary: "Payment adapter work blocked until you're back",
          detail: "Amit started webhook handlers independently, but the core adapter swap requires your leadership as you designed the original interface.",
          priority: "high",
          status: "needs_action",
          sources: [
            { sourceId: "JIRA-2910", sourceType: "ticket", title: "Payment Gateway Migration", snippet: "Priya to lead the adapter work" },
            { sourceId: "meet-003", sourceType: "meeting", title: "Architecture Review", snippet: "Priya will lead the adapter work when she's back. Amit starts webhook handlers independently" },
          ],
        },
      ],
    },
  },
};

export const MOCK_QA_GROUNDED = {
  answer: "The team decided to go with Stripe Connect over Adyen for the payment gateway migration [email-001]. The decision was based on three factors: (1) shorter integration timeline — 3 weeks vs 6 weeks [doc-001], (2) Stripe's Node.js SDK is more mature [meet-003], and (3) transaction fees are comparable at current volume [doc-001]. The architecture review meeting on April 9 confirmed the approach: keep the existing adapter interface (createPayment, getPaymentStatus, refundPayment, listTransactions) and swap the implementation behind it [meet-003]. You've been assigned to lead the adapter work when you return [JIRA-2910]. Amit has already started on the webhook handlers with signature verification and a dead letter queue [meet-003]. One known trade-off: Stripe has fewer payment methods in APAC compared to Adyen, but this is accepted for Phase 2 [doc-001].",
  confidence: "high",
  sources: [
    { sourceId: "email-001", sourceType: "email", title: "RE: Payment Gateway Migration - Decision Needed", snippet: "we've decided to go with Stripe Connect instead of Adyen" },
    { sourceId: "doc-001", sourceType: "document", title: "ADR-015: Payment Gateway Selection", snippet: "Integration timeline: Stripe 3 weeks vs Adyen 6 weeks" },
    { sourceId: "meet-003", sourceType: "meeting", title: "Architecture Review - Payment Gateway Migration", snippet: "Keep existing adapter interface, Priya leads adapter swap" },
    { sourceId: "JIRA-2910", sourceType: "ticket", title: "Payment Gateway Migration - Stripe Connect Integration", snippet: "Priya to lead the adapter work" },
  ],
  gaps: null,
};

export const MOCK_QA_REFUSAL = {
  answer: null,
  refusal: "I don't have sufficient evidence to answer this question. The indexed sources cover emails, chats, tickets, documents, and meeting transcripts from your team's operational data, but they do not contain any financial data such as client budgets, contract values, or pricing information. This type of information would likely be in a separate financial system, CRM, or restricted-access documents that are not part of the current data sources.",
  suggestedSources: [
    "Client contract management system or CRM",
    "Finance team or account leadership",
    "Restricted SharePoint folder for commercial documents",
  ],
  confidence: "none",
};

export const MOCK_CAPTURE = {
  title: "Database Connection Pool Exhaustion — Batch Job Must Use Shared Pool",
  content: `**Problem:** On April 4, 2025, the orders-db PostgreSQL connection pool was exhausted during a traffic spike, causing 45 minutes of degraded service and approximately 200 failed order transactions.

**Root Cause:** A new batch processor for order reconciliation was creating fresh database connections per query using the raw pg.Client instead of the shared connection pool wrapper (db.getPool()). During peak traffic at 2pm, this pushed connections past the 100-connection limit.

**Resolution:**
1. Deployed pgBouncer as a connection pooler in front of orders-db (immediate fix)
2. Fixed batch processor to use the shared pool via db.getPool() helper
3. Connection utilization stabilized at ~60% of pool capacity

**Prevention:**
1. Added connection count monitoring with alerts at 80% threshold
2. Created custom ESLint rule to flag direct pg.Client usage outside the pool module
3. Added "connection pool usage" to the mandatory code review checklist
4. Load testing is now required for all new batch jobs before production deployment

**If This Recurs:**
1. Check current connection count: SELECT count(*) FROM pg_stat_activity WHERE datname = 'orders'
2. Identify connection hogs: SELECT pid, query, state FROM pg_stat_activity WHERE datname = 'orders' ORDER BY backend_start
3. Restart pgBouncer if connections are stuck: sudo systemctl restart pgbouncer
4. Contact Amit Shah or Priya Sharma for escalation`,
  category: "incident",
  tags: ["database", "connection-pool", "pgbouncer", "orders-db", "batch-processing", "p1-incident"],
  sources: [
    { sourceId: "INC-4421", sourceType: "ticket", title: "P1: Connection Pool Exhaustion" },
    { sourceId: "doc-002", sourceType: "document", title: "Postmortem Draft - INC-4421" },
    { sourceId: "meet-004", sourceType: "meeting", title: "INC-4421 Hot Debrief" },
    { sourceId: "email-009", sourceType: "email", title: "Postmortem draft" },
  ],
};
