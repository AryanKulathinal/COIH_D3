import { runToolLoop, parseJson, CACHED_SYSTEM } from "../claude.js";
import { getIncidentContext, getAccount, listPeople } from "../store.js";

const compact = (d) => ({
  sourceId: d.sourceId, sourceType: d.sourceType, timestamp: d.timestamp, from: d.from,
  subject: d.subject || d.channel, body: d.body, status: d.status, component: d.component,
});

export async function captureFromIncident({ account, incidentId, resolutionNote, resolvedBy }) {
  const ctx = getIncidentContext({ account, incidentId });
  if (!ctx) throw Object.assign(new Error(`Incident ${incidentId} not found in this account`), { status: 404 });
  const acct = getAccount(account);

  const prompt = `An incident on ${acct.name} (${acct.client}) has just been resolved. Convert the work that already happened into a structured knowledge entry so the next person never has to ask.

INCIDENT:
${JSON.stringify(compact(ctx.incident), null, 2)}

RELATED THREADS, CHATS AND DOCUMENTS:
${JSON.stringify(ctx.related.map(compact), null, 2)}

RESOLUTION NOTE (written by ${resolvedBy || "the resolver"} when closing the incident):
${resolutionNote || "(none — derive the resolution from the threads above)"}

PEOPLE DIRECTORY:
${JSON.stringify(listPeople({ account }))}

Respond with JSON only:
{
  "title": "Searchable title: symptom — cause",
  "category": "incident" | "troubleshooting" | "process",
  "symptom": "What someone will observe (alerts, error codes, metrics) — phrased the way they would search for it",
  "rootCause": "Confirmed root cause",
  "resolution": "Numbered, concrete steps someone else can follow next time (include config keys/values from the evidence)",
  "prevention": "Follow-ups that stop a recurrence",
  "components": ["component names"],
  "tags": ["6-10 lowercase search tags incl. error codes"],
  "evidence": [{ "sourceId": "...", "sourceType": "...", "title": "..." }],
  "misleadingHypotheses": ["hypotheses tried during the incident that turned out wrong, so nobody repeats them"],
  "contradicts": [{ "sourceId": "...", "note": "which existing record is now outdated and why" }],
  "confidence": "high" | "medium" | "low"
}
Rules: use only the evidence above; cite the incident itself in evidence; if the resolution note conflicts with an older document, trust the note and list the document under contradicts.`;

  const started = Date.now();
  const { text, usage } = await runToolLoop({ system: CACHED_SYSTEM, messages: [{ role: "user", content: prompt }], maxTokens: 8000 });
  const entry = parseJson(text);
  const now = new Date().toISOString();

  return {
    entry: {
      ...entry,
      id: `KB-${account[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      account,
      status: "draft",
      capturedFrom: incidentId,
      capturedBy: resolvedBy || "coih-capture-engine",
      capturedAt: now,
    },
    sourcesRead: [ctx.incident.sourceId, ...ctx.related.map((r) => r.sourceId)],
    tokenUsage: usage,
    ms: Date.now() - started,
  };
}
