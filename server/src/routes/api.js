import { Router } from "express";
import { generateBrief } from "../services/briefGenerator.js";
import { answerQuestion } from "../services/qaAgent.js";
import { captureFromIncident, confirmEntry } from "../services/captureEngine.js";
import { Brief } from "../models/Brief.js";
import { KnowledgeEntry } from "../models/KnowledgeEntry.js";
import { DataSource } from "../models/DataSource.js";
import { MOCK_BRIEF, MOCK_QA_GROUNDED, MOCK_QA_REFUSAL, MOCK_CAPTURE } from "../services/mockResponses.js";

const router = Router();

function isLiveMode() {
  return !!process.env.ANTHROPIC_API_KEY;
}

router.get("/mode", (req, res) => {
  res.json({ mode: isLiveMode() ? "live" : "demo", hasApiKey: isLiveMode() });
});

router.post("/brief/generate", async (req, res) => {
  try {
    const { userId, userName, leaveStart, leaveEnd } = req.body;
    if (!userId || !userName || !leaveStart || !leaveEnd) {
      return res.status(400).json({ error: "Missing required fields: userId, userName, leaveStart, leaveEnd" });
    }

    if (!isLiveMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      const brief = await Brief.create({
        userId, userName,
        leaveStart: new Date(leaveStart),
        leaveEnd: new Date(leaveEnd),
        overview: MOCK_BRIEF.overview,
        sections: MOCK_BRIEF.sections,
        stats: MOCK_BRIEF.stats,
        tokenUsage: { inputTokens: 12450, outputTokens: 3200, cacheReadTokens: 8100, cacheCreationTokens: 1200, estimatedCost: 0.0389 },
      });
      return res.json(brief);
    }

    const brief = await generateBrief({ userId, userName, leaveStart, leaveEnd });
    res.json(brief);
  } catch (err) {
    console.error("Brief generation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/brief/:id", async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);
    if (!brief) return res.status(404).json({ error: "Brief not found" });
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/briefs", async (req, res) => {
  try {
    const briefs = await Brief.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json(briefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/qa/ask", async (req, res) => {
  try {
    const { question, conversationHistory } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    if (!isLiveMode()) {
      await new Promise((r) => setTimeout(r, 1500));
      const refusalKeywords = ["budget", "salary", "cost", "revenue", "contract value", "pricing", "forecast", "headcount"];
      const isRefusal = refusalKeywords.some((k) => question.toLowerCase().includes(k));
      const mockResponse = isRefusal ? MOCK_QA_REFUSAL : MOCK_QA_GROUNDED;
      return res.json({
        ...mockResponse,
        tokenUsage: { inputTokens: 4200, outputTokens: 850, cacheReadTokens: 3100, cacheCreationTokens: 0, estimatedCost: 0.0125 },
      });
    }

    const result = await answerQuestion({ question, conversationHistory });
    res.json(result);
  } catch (err) {
    console.error("QA failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/capture/incident", async (req, res) => {
  try {
    const { incidentId } = req.body;
    if (!incidentId) return res.status(400).json({ error: "Missing incidentId" });

    if (!isLiveMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      const entry = await KnowledgeEntry.create({
        ...MOCK_CAPTURE,
        account: "demo-account",
        createdBy: "coih-capture-engine",
        status: "draft",
        provenance: { capturedFrom: incidentId, capturedAt: new Date(), lastVerified: new Date() },
      });
      return res.json({
        entry,
        tokenUsage: { inputTokens: 3800, outputTokens: 920, cacheReadTokens: 2800, cacheCreationTokens: 0, estimatedCost: 0.0155 },
      });
    }

    const result = await captureFromIncident({ incidentId });
    res.json(result);
  } catch (err) {
    console.error("Capture failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/capture/confirm", async (req, res) => {
  try {
    const { entryId, confirmedBy, edits } = req.body;
    const entry = await confirmEntry({ entryId, confirmedBy, edits });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/knowledge", async (req, res) => {
  try {
    const entries = await KnowledgeEntry.find({ account: "demo-account" }).sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/data-sources/stats", async (req, res) => {
  try {
    const pipeline = [
      { $match: { account: "demo-account" } },
      { $group: { _id: "$sourceType", count: { $sum: 1 } } },
    ];
    const stats = await DataSource.aggregate(pipeline);
    const actionItems = await DataSource.countDocuments({ account: "demo-account", requiresAction: true });
    const total = await DataSource.countDocuments({ account: "demo-account" });
    res.json({ sources: stats, actionItems, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/data-sources/incidents", async (req, res) => {
  try {
    const incidents = await DataSource.find({
      account: "demo-account",
      sourceType: "ticket",
      tags: "incident",
    }).sort({ timestamp: -1 }).lean();
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
