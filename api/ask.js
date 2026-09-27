import { apiHandler, requireString, withFallback, fallbackKey } from "../lib/guard.js";
import { getPersona } from "../lib/store.js";
import { answerQuestion } from "../lib/agents/qa.js";

export default apiHandler(async (body, req, res) => {
  const question = requireString(body.question, "question", 1000);
  const persona = getPersona(body.personaId);
  const kbMode = body.kbMode === "disconnected" ? "disconnected" : "connected";
  const result = await withFallback(body.accountId, fallbackKey("ask", kbMode, body.capturedEntries?.length ? "captured" : "seed", question), () =>
    answerQuestion({
      account: body.accountId,
      persona: persona?.account === body.accountId ? persona : null,
      question,
      history: Array.isArray(body.history) ? body.history : [],
      kbMode,
      capturedEntries: body.capturedEntries,
    })
  );
  res.status(200).json(result);
});
