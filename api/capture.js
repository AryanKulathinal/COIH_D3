import { apiHandler, requireString, withFallback, fallbackKey } from "../lib/guard.js";
import { captureFromIncident } from "../lib/agents/capture.js";

export default apiHandler(async (body, req, res) => {
  const incidentId = requireString(body.incidentId, "incidentId", 40);
  const resolutionNote = typeof body.resolutionNote === "string" ? body.resolutionNote.slice(0, 3000) : "";
  const result = await withFallback(body.accountId, fallbackKey("capture", incidentId), () =>
    captureFromIncident({
      account: body.accountId,
      incidentId,
      resolutionNote,
      resolvedBy: typeof body.resolvedBy === "string" ? body.resolvedBy.slice(0, 80) : undefined,
    })
  );
  res.status(200).json(result);
});
