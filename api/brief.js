// Streams NDJSON progress events ({type:"tool"}) while the brief agent works, then {type:"done"}.
import { apiHandler, HttpError, loadFallback, fallbackKey } from "../lib/guard.js";
import { getPersona } from "../lib/store.js";
import { generateBrief } from "../lib/agents/brief.js";

export default apiHandler(async (body, req, res) => {
  const persona = getPersona(body.personaId);
  if (!persona || persona.account !== body.accountId || !persona.leave) {
    throw new HttpError(400, "This persona has no leave window to brief on");
  }

  res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  const send = (event) => res.write(`${JSON.stringify(event)}\n`);
  send({ type: "start", label: `Scanning ${persona.leave.start} → ${persona.leave.end}` });

  try {
    const result = await generateBrief({ account: body.accountId, persona, onEvent: send });
    send({ type: "done", ...result });
  } catch (err) {
    console.error(err);
    const recorded = loadFallback(body.accountId, fallbackKey("brief", persona.id));
    send(recorded ? { type: "done", ...recorded, fallback: true } : { type: "error", error: err.status ? err.message : "Brief generation failed. Please try again." });
  }
  res.end();
});
