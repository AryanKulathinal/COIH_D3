import { MessageCircleQuestion, Brain, Hourglass, ShieldCheck, RefreshCw, Rocket } from "lucide-react";

// Slide deck shown on the landing page before sign-in.
// tiles: { stat, label, sub? } renders a big number; { title, label } renders a principle.
export const SLIDES = [
  {
    id: "problem",
    icon: MessageCircleQuestion,
    kicker: "The problem",
    title: "Four questions nobody can answer fast.",
    body: "Back from leave: what changed? New joiner: how does this account actually work? Someone resigns: what leaves with them? A question at 6 pm: who do I interrupt? Today every one of them is answered by a human being.",
    tiles: [
      { stat: "3–5 h", label: "to catch up after every leave" },
      { stat: "60–90 days", label: "for a new joiner to become productive" },
      { stat: "2×", label: "people's time spent on every quick question" },
    ],
  },
  {
    id: "root-cause",
    icon: Brain,
    kicker: "The root cause",
    title: "Knowledge is tacit, scattered, undocumented.",
    body: "The answers exist, in heads, threads and tickets nobody links together. So every catch-up, every ramp-up and every “how do I fix this?” turns a colleague into the search engine. When they leave, the knowledge leaves with them.",
    tiles: [
      { title: "In heads", label: "Decisions made on calls and in DMs, never written down" },
      { title: "In threads", label: "Context buried on page six of a chat" },
      { title: "In tickets", label: "Fixes closed as “resolved” with no root cause" },
    ],
  },
  {
    id: "cost",
    icon: Hourglass,
    kicker: "The cost",
    title: "120,000–200,000 hours a year.",
    body: "Across a 5,000-person organisation, leave catch-up alone burns that much. Add senior-engineer interrupts and 90-day ramps, and it is the hidden line item on every account.",
    tiles: [
      { stat: "5,000", label: "associates in the organisation" },
      { stat: "120k–200k", label: "productivity hours lost every year" },
      { stat: "0", label: "systems of record for operational knowledge" },
    ],
  },
  {
    id: "hub",
    icon: ShieldCheck,
    kicker: "What COIH does",
    title: "Grounded in your account, or silent.",
    body: "COIH indexes the tools the account already runs: mail, chat, Jira, incidents, docs and meetings. Claude answers only from those records, with a source on every claim. No evidence? It refuses, names the gap and the person to ask.",
    tiles: [
      { title: "Mail · Chat · Meetings", label: "What was said and decided" },
      { title: "Jira · Incidents", label: "What broke and what changed" },
      { title: "Docs · Knowledge", label: "What the team already captured" },
    ],
  },
  {
    id: "capture",
    icon: RefreshCw,
    kicker: "The difference",
    title: "Capture is free.",
    body: "Resolve an incident and the fix becomes a structured entry: symptom, root cause, steps, evidence. Confirmed in one click. The next person asking gets an answer instead of an escalation. Every incident makes the next one cheaper.",
    tiles: [
      { title: "Grounded or silent", label: "Every answer cites a source, or it refuses" },
      { title: "Capture is free", label: "Knowledge is created from work, not as extra work" },
      { title: "Account-scoped", label: "No cross-account retrieval, ever" },
      { title: "Pluggable", label: "Adapters for the stack you already run" },
    ],
  },
  {
    id: "impact",
    icon: Rocket,
    kicker: "The impact",
    title: "From hours to minutes.",
    body: "Three associates, two isolated accounts, one live incident. Pick who you are and watch it happen.",
    tiles: [
      { stat: "< 30 min", label: "return-from-leave catch-up", sub: "was 3–5 hours" },
      { stat: "30–45 days", label: "new-joiner ramp", sub: "was 60–90 days" },
      { stat: "30–40%", label: "less senior-engineer interrupt load" },
    ],
  },
];
