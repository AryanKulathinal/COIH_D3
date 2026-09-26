import { Router } from "express";
import { generateFlashcards, generateQuiz, generateAudioScript, generateInfographic } from "../services/insightsGenerator.js";
import { MOCK_FLASHCARDS, MOCK_QUIZ, MOCK_AUDIO_SCRIPT, MOCK_INFOGRAPHIC } from "../services/mockInsights.js";

const router = Router();

function isLive() { return !!process.env.ANTHROPIC_API_KEY; }

router.post("/flashcards", async (req, res) => {
  try {
    const { leaveStart, leaveEnd } = req.body;
    if (!isLive()) {
      await new Promise((r) => setTimeout(r, 1500));
      return res.json(MOCK_FLASHCARDS);
    }
    const result = await generateFlashcards({ leaveStart, leaveEnd });
    res.json(result);
  } catch (err) {
    console.error("Flashcards failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/quiz", async (req, res) => {
  try {
    const { leaveStart, leaveEnd } = req.body;
    if (!isLive()) {
      await new Promise((r) => setTimeout(r, 1500));
      return res.json(MOCK_QUIZ);
    }
    const result = await generateQuiz({ leaveStart, leaveEnd });
    res.json(result);
  } catch (err) {
    console.error("Quiz failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/audio", async (req, res) => {
  try {
    const { leaveStart, leaveEnd } = req.body;
    if (!isLive()) {
      await new Promise((r) => setTimeout(r, 1000));
      return res.json(MOCK_AUDIO_SCRIPT);
    }
    const result = await generateAudioScript({ leaveStart, leaveEnd });
    res.json(result);
  } catch (err) {
    console.error("Audio failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/infographic", async (req, res) => {
  try {
    const { leaveStart, leaveEnd } = req.body;
    if (!isLive()) {
      return res.json(MOCK_INFOGRAPHIC);
    }
    const result = await generateInfographic({ leaveStart, leaveEnd });
    res.json(result);
  } catch (err) {
    console.error("Infographic failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
