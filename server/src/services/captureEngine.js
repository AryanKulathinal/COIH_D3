import { getClient, CACHED_SYSTEM, MODEL, trackUsage } from "./claudeClient.js";
import { getThreadMessages } from "./dataAdapter.js";
import { KnowledgeEntry } from "../models/KnowledgeEntry.js";
import { DataSource } from "../models/DataSource.js";

export async function captureFromIncident({ incidentId }) {
  const client = getClient();

  const incident = await DataSource.findOne({ sourceId: incidentId }).lean();
  if (!incident) throw new Error(`Incident ${incidentId} not found`);

  const relatedThreads = await DataSource.find({
    $or: [
      { thread: incident.thread },
      { tags: { $in: incident.tags } },
      { sourceId: { $regex: incidentId } },
    ],
    account: incident.account,
  }).sort({ timestamp: 1 }).lean();

  const contextData = relatedThreads.map((d) => ({
    sourceId: d.sourceId,
    sourceType: d.sourceType,
    timestamp: d.timestamp,
    from: d.from,
    subject: d.subject,
    body: d.body,
    tags: d.tags,
    status: d.status,
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: CACHED_SYSTEM,
    thinking: { type: "adaptive" },
    messages: [{
      role: "user",
      content: `Analyze this incident and its related threads. Create a knowledge entry that captures the operational learning.

INCIDENT: ${JSON.stringify(incident, null, 2)}

RELATED THREADS AND MESSAGES:
${JSON.stringify(contextData, null, 2)}

Create a knowledge entry in this JSON format:
{
  "title": "Clear, searchable title describing the issue and resolution",
  "content": "Structured write-up covering: Problem, Root Cause, Resolution, Prevention. Written so a future engineer can understand and apply this without asking anyone.",
  "category": "incident|decision|process|troubleshooting",
  "tags": ["relevant", "searchable", "tags"],
  "sources": [{"sourceId": "...", "sourceType": "...", "title": "..."}]
}

The entry should be:
- Self-contained: readable without the original thread
- Actionable: includes what to do if the problem recurs
- Searchable: tags and title match how someone would look for this`,
    }],
  });

  const usage = trackUsage(response);
  const textContent = response.content.find((b) => b.type === "text");

  let entryData;
  try {
    const jsonStr = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    entryData = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse knowledge entry from Claude response");
  }

  const entry = await KnowledgeEntry.create({
    ...entryData,
    account: incident.account,
    createdBy: "coih-capture-engine",
    status: "draft",
    provenance: {
      capturedFrom: incidentId,
      capturedAt: new Date(),
      lastVerified: new Date(),
    },
  });

  return { entry, tokenUsage: usage };
}

export async function confirmEntry({ entryId, confirmedBy, edits }) {
  const update = { status: "confirmed", confirmedBy };
  if (edits?.title) update.title = edits.title;
  if (edits?.content) update.content = edits.content;
  if (edits?.tags) update.tags = edits.tags;

  return KnowledgeEntry.findByIdAndUpdate(entryId, update, { new: true });
}
