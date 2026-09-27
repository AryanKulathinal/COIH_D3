import { MODEL } from "../lib/llm.js";

export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    model: MODEL,
    modelConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
