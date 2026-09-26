export const MOCK_FLASHCARDS = {
  flashcards: [
    { id: 1, category: "decision", front: "Which payment gateway was selected for the migration?", back: "Stripe Connect was chosen over Adyen. Shorter integration (3 weeks vs 6), mature Node.js SDK. You'll lead the adapter implementation.", priority: "high", sourceId: "email-001" },
    { id: 2, category: "incident", front: "What caused the P1 incident on April 4th?", back: "Database connection pool exhaustion on orders-db. Batch processor was opening individual connections instead of using the pool. 45 min downtime, ~200 failed orders. Fixed with pgBouncer.", priority: "critical", sourceId: "INC-4421" },
    { id: 3, category: "task", front: "What happened to your API rate limiting ticket (JIRA-2847)?", back: "Deepa took it over and changed the approach from fixed window to sliding window. PR #342 is ready for your review.", priority: "high", sourceId: "JIRA-2847" },
    { id: 4, category: "update", front: "What's the security CVE status for auth-service?", back: "CVE-2025-3102 in jsonwebtoken patched by Deepa. Upgraded to v9.0.3+, deployed to prod April 13. Verified by Amit. Fully resolved.", priority: "critical", sourceId: "SEC-891" },
    { id: 5, category: "task", front: "Who is Vikram Patel and what do you need to prepare?", back: "New team member starting April 21 on inventory service (your domain). You need to prepare a KT plan: service architecture, deployment pipeline, failure modes, client contacts. 3 sessions planned.", priority: "high", sourceId: "email-007" },
    { id: 6, category: "meeting", front: "What did the client CTO request after the dashboard demo?", back: "Two things: (1) Predictive inventory alerts ('SKU X out of stock in 3 days'), (2) PDF export for monthly reports. Added to Phase 2 backlog.", priority: "medium", sourceId: "meet-002" },
    { id: 7, category: "incident", front: "What bug is assigned to you on the inventory API?", back: "JIRA-2901: Intermittent 504 timeouts during peak hours (2-4pm EST). Suspected relation to your cache invalidation logic. Needs investigation.", priority: "high", sourceId: "JIRA-2901" },
    { id: 8, category: "decision", front: "What architecture approach was decided for the Stripe migration?", back: "Keep existing adapter interface (createPayment, getPaymentStatus, refundPayment, listTransactions). Swap implementation behind it. Amit started webhook handlers independently.", priority: "high", sourceId: "meet-003" },
    { id: 9, category: "update", front: "What's the Q2 SLA situation with the client?", back: "March uptime was 99.92% vs 99.95% target. SLA review meeting on April 18. Two incidents to discuss (March 15 and March 28). Amit is preparing the incident report.", priority: "medium", sourceId: "email-002" },
    { id: 10, category: "task", front: "What meeting do you need to prepare for on April 16?", back: "INC-4421 postmortem review. Amit drafted the postmortem. Your input requested on connection management patterns since you designed the pool wrapper.", priority: "high", sourceId: "cal-001" },
  ],
};

export const MOCK_QUIZ = {
  questions: [
    { id: 1, question: "Which payment gateway was selected for the migration?", options: ["Adyen", "Stripe Connect", "PayPal", "Square"], correctIndex: 1, explanation: "Stripe Connect was selected due to shorter integration timeline (3 weeks vs 6 for Adyen) and mature Node.js SDK. [email-001, doc-001]", sourceId: "email-001", difficulty: "easy" },
    { id: 2, question: "What was the root cause of incident INC-4421?", options: ["Memory leak in the API layer", "Batch processor opening individual DB connections instead of using pool", "DNS misconfiguration", "Redis cache overflow"], correctIndex: 1, explanation: "The batch processor was creating new connections per query rather than using the shared connection pool, exhausting the 100-connection limit. [INC-4421]", sourceId: "INC-4421", difficulty: "medium" },
    { id: 3, question: "What algorithm change did Deepa make to the API rate limiting?", options: ["Leaky bucket to token bucket", "Fixed window to sliding window", "Token bucket to leaky bucket", "No change, kept the original"], correctIndex: 1, explanation: "Deepa changed from fixed window to sliding window because fixed window allows burst traffic at window boundaries. [email-005, doc-003]", sourceId: "email-005", difficulty: "medium" },
    { id: 4, question: "When does new team member Vikram Patel start?", options: ["April 14", "April 18", "April 21", "May 1"], correctIndex: 2, explanation: "Vikram starts April 21 and will work on the inventory service. KT sessions are planned for his first week. [email-007, meet-001]", sourceId: "email-007", difficulty: "easy" },
    { id: 5, question: "What was the March uptime vs. the SLA target?", options: ["99.95% vs 99.99%", "99.92% vs 99.95%", "99.80% vs 99.90%", "99.99% vs 99.95%"], correctIndex: 1, explanation: "March uptime was 99.92%, below the 99.95% SLA target. This will be discussed at the Q2 SLA review on April 18. [email-002]", sourceId: "email-002", difficulty: "medium" },
    { id: 6, question: "What vulnerability was patched in the auth-service?", options: ["CVE-2025-1001 in bcrypt", "CVE-2025-3102 in jsonwebtoken", "CVE-2025-2050 in express", "CVE-2025-4200 in passport"], correctIndex: 1, explanation: "CVE-2025-3102 in jsonwebtoken < 9.0.3. Deepa upgraded and deployed. Verified by Amit on April 13. [email-008, SEC-891]", sourceId: "email-008", difficulty: "hard" },
    { id: 7, question: "How many failed orders resulted from the P1 incident?", options: ["~50", "~100", "~200", "~500"], correctIndex: 2, explanation: "Approximately 200 order transactions failed during the 45 minutes of degraded service. [INC-4421]", sourceId: "INC-4421", difficulty: "hard" },
    { id: 8, question: "What feature did the client CTO request after the dashboard demo?", options: ["Dark mode toggle", "Predictive inventory alerts", "Multi-language support", "Mobile app version"], correctIndex: 1, explanation: "The CTO requested predictive inventory alerts ('SKU X will be out of stock in 3 days') as a Phase 2 feature. [meet-002, chat-005]", sourceId: "meet-002", difficulty: "easy" },
  ],
};

export const MOCK_AUDIO_SCRIPT = {
  title: "Your Leave Brief — Apr 1 to Apr 14",
  duration: "2-3 min",
  segments: [
    { type: "intro", label: "Welcome Back", text: "Hey Priya, welcome back! You've been away for two weeks and quite a bit has happened. Let me walk you through the highlights so you can hit the ground running." },
    { type: "summary", label: "Quick Overview", text: "During your absence, the team handled 33 items across your data sources — 9 emails, 9 chat messages, 5 tickets, 4 meetings, and 3 documents. There are about 8 items that need your direct attention." },
    { type: "incidents", label: "Critical Items", text: "First, the critical stuff. There was a P1 incident on April 4th — the orders database connection pool got exhausted. A batch processor was opening individual connections instead of using the pool. Amit fixed it with pgBouncer, and the postmortem is scheduled for April 16th. They need your input since you designed the pool wrapper. Also, there was a critical security CVE in the jsonwebtoken library. Good news — Deepa already patched it and deployed to production. That's fully resolved." },
    { type: "decisions", label: "Key Decisions", text: "Two big decisions were made. First, the team selected Stripe Connect over Adyen for the payment gateway migration. The main reasons were a shorter integration timeline — 3 weeks versus 6 — and a more mature Node.js SDK. You've been assigned to lead the adapter implementation. Second, Deepa took over your API rate limiting ticket and changed the approach from fixed window to sliding window. Her PR number 342 is ready for your review." },
    { type: "action_items", label: "Your Action Items", text: "Here's what needs your attention: Review and contribute to the INC-4421 postmortem before the April 16th meeting. Review Deepa's rate limiting PR. Investigate the intermittent 504 errors on the inventory API — the client reported timeouts during peak hours. Prepare a knowledge transfer plan for Vikram Patel, who's joining the team on April 21st to work on your inventory service. And start planning the Stripe Connect adapter work." },
    { type: "closing", label: "Wrap Up", text: "That's the quick version. The SLA review with the client is on April 18th — March uptime was slightly below target. The dashboard demo went well, and the client wants predictive inventory alerts as a Phase 2 feature. You're in good shape — the team handled the urgent stuff while you were away. Focus on the postmortem and the rate limiting review first, then tackle the rest." },
  ],
};

export const MOCK_INFOGRAPHIC = {
  summary: { totalItems: 33, email: 9, chat: 9, ticket: 5, meeting: 4, document: 3, calendar: 3, actionItems: 14, mentionsUser: 8 },
  byType: { email: 9, chat: 9, ticket: 5, meeting: 4, document: 3, calendar: 3 },
  byPriority: { critical: 4, high: 16, medium: 9, low: 4 },
  byDay: { "Apr 2": 3, "Apr 3": 3, "Apr 4": 2, "Apr 5": 2, "Apr 7": 3, "Apr 8": 3, "Apr 9": 4, "Apr 10": 3, "Apr 11": 4, "Apr 12": 2, "Apr 13": 1 },
  actionItems: [
    { sourceId: "JIRA-2910", subject: "Payment Gateway Migration - Stripe Connect", priority: "high" },
    { sourceId: "JIRA-2847", subject: "Review PR #342 - API Rate Limiting", priority: "high" },
    { sourceId: "JIRA-2901", subject: "Investigate 504s on Inventory API", priority: "high" },
    { sourceId: "email-007", subject: "Prepare KT for Vikram Patel", priority: "high" },
    { sourceId: "email-009", subject: "Review INC-4421 Postmortem", priority: "high" },
    { sourceId: "cal-001", subject: "Attend Postmortem Meeting (Apr 16)", priority: "high" },
  ],
  resolvedItems: [
    { sourceId: "INC-4421", subject: "P1: DB Connection Pool Exhaustion" },
    { sourceId: "SEC-891", subject: "CVE-2025-3102 jsonwebtoken Patch" },
  ],
  timeline: [
    { date: "Apr 2", sourceId: "email-001", sourceType: "email", subject: "Payment Gateway Decision - Stripe Connect", priority: "high" },
    { date: "Apr 3", sourceId: "meet-001", sourceType: "meeting", subject: "Sprint 24 Planning", priority: "high" },
    { date: "Apr 4", sourceId: "INC-4421", sourceType: "ticket", subject: "P1: DB Connection Pool Exhaustion", priority: "critical", status: "resolved" },
    { date: "Apr 7", sourceId: "meet-002", sourceType: "meeting", subject: "Client Dashboard Demo Debrief", priority: "high" },
    { date: "Apr 8", sourceId: "email-005", sourceType: "email", subject: "API Rate Limiting - Reassigned", priority: "high" },
    { date: "Apr 9", sourceId: "meet-003", sourceType: "meeting", subject: "Architecture Review - Payment Gateway", priority: "high" },
    { date: "Apr 10", sourceId: "email-007", sourceType: "email", subject: "KT Planning for Vikram Patel", priority: "high" },
    { date: "Apr 11", sourceId: "email-008", sourceType: "email", subject: "URGENT: CVE-2025-3102", priority: "critical" },
    { date: "Apr 11", sourceId: "meet-004", sourceType: "meeting", subject: "INC-4421 Hot Debrief", priority: "high" },
    { date: "Apr 13", sourceId: "chat-009", sourceType: "chat", subject: "CVE patch deployed to prod", priority: "medium", status: "resolved" },
  ],
};
