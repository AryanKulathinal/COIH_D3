import { getClient, CACHED_SYSTEM, MODEL, trackUsage } from "./claudeClient.js";
import { queryDataSources, getStats } from "./dataAdapter.js";

export async function generateFlashcards({ leaveStart, leaveEnd }) {
  const client = getClient();

  const allData = await queryDataSources({ startDate: leaveStart, endDate: leaveEnd });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: CACHED_SYSTEM,
    thinking: { type: "adaptive" },
    messages: [{
      role: "user",
      content: `Based on the following data from a leave period (${leaveStart} to ${leaveEnd}), generate flashcards for quick review.

DATA:
${JSON.stringify(allData.slice(0, 30), null, 2)}

Generate 8-12 flashcards in this JSON format:
{
  "flashcards": [
    {
      "id": 1,
      "category": "decision|incident|task|update|meeting",
      "front": "Short question about what happened (1 line)",
      "back": "Concise answer with key details (2-3 lines)",
      "priority": "high|medium|low",
      "sourceId": "email-001"
    }
  ]
}

Rules:
- Front should be a question the returning associate needs to know
- Back should be the factual answer from the data
- Prioritize actionable items (things needing their attention)
- Include the sourceId for traceability
- Mix categories: decisions, incidents, tasks, updates`,
    }],
  });

  const usage = trackUsage(response);
  const text = response.content.find((b) => b.type === "text")?.text || "";
  try {
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { ...JSON.parse(jsonStr), tokenUsage: usage };
  } catch {
    return { flashcards: [], tokenUsage: usage };
  }
}

export async function generateQuiz({ leaveStart, leaveEnd }) {
  const client = getClient();

  const allData = await queryDataSources({ startDate: leaveStart, endDate: leaveEnd });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: CACHED_SYSTEM,
    thinking: { type: "adaptive" },
    messages: [{
      role: "user",
      content: `Based on the following data from a leave period (${leaveStart} to ${leaveEnd}), generate a quiz to verify the returning associate has caught up on what happened.

DATA:
${JSON.stringify(allData.slice(0, 30), null, 2)}

Generate 8 quiz questions in this JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear question about what happened during the leave",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct, with source reference",
      "sourceId": "email-001",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Rules:
- Questions should test understanding of key events, decisions, and action items
- Mix difficulty levels
- All answers must be factual from the data
- Include sourceId for each question
- Options should be plausible but only one correct`,
    }],
  });

  const usage = trackUsage(response);
  const text = response.content.find((b) => b.type === "text")?.text || "";
  try {
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { ...JSON.parse(jsonStr), tokenUsage: usage };
  } catch {
    return { questions: [], tokenUsage: usage };
  }
}

export async function generateAudioScript({ leaveStart, leaveEnd }) {
  const client = getClient();

  const allData = await queryDataSources({ startDate: leaveStart, endDate: leaveEnd });
  const stats = await getStats({ startDate: leaveStart, endDate: leaveEnd });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: CACHED_SYSTEM,
    thinking: { type: "adaptive" },
    messages: [{
      role: "user",
      content: `Based on the following data from a leave period (${leaveStart} to ${leaveEnd}), generate a podcast-style audio briefing script that can be read aloud via text-to-speech.

STATS: ${JSON.stringify(stats)}

DATA:
${JSON.stringify(allData.slice(0, 30), null, 2)}

Generate a natural, conversational briefing script in this JSON format:
{
  "title": "Your Leave Brief - Apr 1 to Apr 14",
  "duration": "2-3 min",
  "segments": [
    {
      "type": "intro|summary|decisions|incidents|action_items|closing",
      "label": "Section label",
      "text": "Natural spoken text for this segment. Write as if speaking to the person directly. Use conversational tone."
    }
  ]
}

Rules:
- Write naturally, as if a colleague is briefing them verbally
- Keep it concise — aim for 2-3 minutes of speaking time
- Start with a warm welcome back
- Prioritize: critical items first, then decisions, then FYI
- End with clear action items they need to handle
- Don't use bullet points or formatting — this will be spoken aloud`,
    }],
  });

  const usage = trackUsage(response);
  const text = response.content.find((b) => b.type === "text")?.text || "";
  try {
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { ...JSON.parse(jsonStr), tokenUsage: usage };
  } catch {
    return { segments: [], tokenUsage: usage };
  }
}

export async function generateInfographic({ leaveStart, leaveEnd }) {
  const allData = await queryDataSources({ startDate: leaveStart, endDate: leaveEnd });
  const stats = await getStats({ startDate: leaveStart, endDate: leaveEnd });

  const byType = {};
  const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
  const byDay = {};
  const actionItems = [];
  const resolvedItems = [];
  const timeline = [];

  for (const item of allData) {
    byType[item.sourceType] = (byType[item.sourceType] || 0) + 1;
    if (item.priority) byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;

    const day = new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay[day] = (byDay[day] || 0) + 1;

    if (item.requiresAction) actionItems.push({ sourceId: item.sourceId, subject: item.subject, priority: item.priority });
    if (item.status === "resolved") resolvedItems.push({ sourceId: item.sourceId, subject: item.subject });

    if (item.priority === "high" || item.priority === "critical" || item.mentionsUser) {
      timeline.push({
        date: day,
        sourceId: item.sourceId,
        sourceType: item.sourceType,
        subject: item.subject || item.body?.slice(0, 60),
        priority: item.priority,
        status: item.status,
      });
    }
  }

  return {
    summary: {
      totalItems: allData.length,
      ...stats,
    },
    byType,
    byPriority,
    byDay,
    actionItems,
    resolvedItems,
    timeline: timeline.slice(0, 15),
  };
}
