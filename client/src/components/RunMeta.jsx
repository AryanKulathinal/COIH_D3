import { Coins, Timer, History } from "lucide-react";

// Cost / latency footprint of a Claude run, plus an honest marker when a recorded response was served.
export default function RunMeta({ result, manualHours }) {
  if (!result) return null;
  const u = result.tokenUsage;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", fontSize: "0.625rem", color: "var(--text-muted)" }}>
      {result.ms != null && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><Timer size={11} />{(result.ms / 1000).toFixed(1)}s</span>}
      {u && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }} title={`${u.inputTokens} in · ${u.outputTokens} out · ${u.cacheReadTokens} cache-read · ${u.apiCalls ?? "?"} API calls`}>
          <Coins size={11} />{(u.inputTokens + u.outputTokens + u.cacheReadTokens).toLocaleString()} tokens · ${u.estimatedCost?.toFixed(3)}
        </span>
      )}
      {manualHours && <span>vs ≈{manualHours}h manual catch-up</span>}
      {result.fallback && (
        <span className="badge badge-low" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }} title="Claude was unavailable, so a response recorded from an earlier live run is shown.">
          <History size={10} /> recorded response
        </span>
      )}
    </div>
  );
}
