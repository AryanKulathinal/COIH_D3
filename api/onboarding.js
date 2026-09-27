import { apiHandler, HttpError, withFallback, fallbackKey } from "../lib/guard.js";
import { getPersona } from "../lib/store.js";
import { generateOnboarding } from "../lib/agents/onboarding.js";

export default apiHandler(async (body, req, res) => {
  const persona = getPersona(body.personaId);
  if (!persona || persona.account !== body.accountId) throw new HttpError(400, "Unknown persona for this account");
  const result = await withFallback(body.accountId, fallbackKey("onboarding", persona.id), () =>
    generateOnboarding({ account: body.accountId, persona, capturedEntries: body.capturedEntries })
  );
  res.status(200).json(result);
});
