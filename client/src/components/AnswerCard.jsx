import { CheckCircle, HelpCircle, AlertCircle, ShieldAlert, UserRound, BookOpen, ShieldCheck, MessageSquareDashed, ShieldOff } from "lucide-react";
import { CitedText, SourceChip } from "./SourceDrawer.jsx";
import RunMeta from "./RunMeta.jsx";

const CONFIDENCE = {
  high: { icon: CheckCircle, color: "var(--success)", bg: "var(--success-light)", label: "High confidence" },
  medium: { icon: HelpCircle, color: "var(--warning-dark)", bg: "var(--warning-light)", label: "Medium confidence" },
  low: { icon: AlertCircle, color: "var(--warning-dark)", bg: "var(--warning-light)", label: "Low confidence" },
  none: { icon: ShieldAlert, color: "var(--error-dark)", bg: "var(--error-light)", label: "Insufficient evidence — refused" },
};

// The comparison baseline: same model, no account records, no knowledge layer, no tools.
// Nothing in it can be verified, so it is deliberately rendered without sources or confidence.
function PlainChatCard({ data }) {
  return (
    <div className="card fade-in" style={{ padding: "0.75rem", borderColor: "var(--grey-300)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <span className="badge" style={{ background: "var(--grey-300)", color: "var(--grey-700)", display: "inline-flex", gap: "0.25rem", fontWeight: 600 }}>
          <MessageSquareDashed size={11} /> Generic answer — no account sources
        </span>
        <span className="badge" style={{ background: "var(--grey-300)", color: "var(--grey-600)", display: "inline-flex", gap: "0.25rem" }}
          title="This side has no access to the account's records or knowledge base, so nothing it says can be checked.">
          <ShieldOff size={11} /> unverifiable
        </span>
      </div>
      {data.answer
        ? <div style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem", lineHeight: 1.7, color: "var(--grey-800)" }}>{data.answer}</div>
        : <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>The assistant returned no answer.</div>}
      {data.gaps?.length > 0 && (
        <div style={{ marginTop: "0.5rem", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-md)", background: "var(--grey-100)", fontSize: "0.625rem", color: "var(--grey-700)" }}>
          <strong>What it cannot know:</strong> {data.gaps.join("; ")}
        </div>
      )}
      <div style={{ marginTop: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)" }}>
        Sources: none. This is general knowledge, not this account's history — nothing above links back to a record.
      </div>
      <div style={{ marginTop: "0.5rem" }}><RunMeta result={data} /></div>
    </div>
  );
}

export default function AnswerCard({ data }) {
  if (data.grounded === false) return <PlainChatCard data={data} />;
  const refused = !data.answer || data.confidence === "none";
  const c = CONFIDENCE[refused ? "none" : data.confidence] || CONFIDENCE.medium;
  const Icon = c.icon;
  const usedKb = data.sources?.some((s) => s.sourceId?.startsWith("KB-"));

  return (
    <div className="card fade-in" style={{ padding: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <span className="badge" style={{ background: c.bg, color: c.color, display: "inline-flex", gap: "0.25rem", fontWeight: 600 }}>
          <Icon size={11} /> {c.label}
        </span>
        {usedKb && (
          <span className="badge badge-resolved" style={{ display: "inline-flex", gap: "0.25rem" }}>
            <BookOpen size={11} /> answered from captured knowledge
          </span>
        )}
        {data.verification && !refused && (
          <span className="badge badge-low" style={{ display: "inline-flex", gap: "0.25rem" }}
            title="Every citation is checked server-side against the records actually retrieved for this answer.">
            <ShieldCheck size={11} /> citations verified
            {data.verification.removed?.length > 0 && ` · ${data.verification.removed.length} unverifiable removed`}
          </span>
        )}
      </div>

      {!refused && <CitedText text={data.answer} style={{ fontSize: "0.75rem", lineHeight: 1.7, color: "var(--grey-900)" }} />}

      {refused && (
        <div style={{ padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", background: "var(--error-light)", border: "1px solid var(--error)" }}>
          <div style={{ fontSize: "0.688rem", fontWeight: 600, color: "var(--error-dark)", marginBottom: "0.25rem" }}>Calibrated refusal — the hub will not guess</div>
          <CitedText text={data.refusal || data.answer || "Not enough evidence in this account's records."} style={{ fontSize: "0.688rem", color: "var(--error-dark)", lineHeight: 1.6 }} />
        </div>
      )}

      {data.suggestedContact?.name && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", marginTop: "0.5rem", fontSize: "0.688rem", color: "var(--grey-700)" }}>
          <UserRound size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong style={{ fontWeight: 600 }}>Ask {data.suggestedContact.name}</strong> — {data.suggestedContact.reason}</span>
        </div>
      )}

      {data.sources?.length > 0 && (
        <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "0.5rem" }}>
          <div style={{ fontSize: "0.563rem", color: "var(--text-muted)", marginBottom: "0.313rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sources ({data.sources.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {data.sources.map((src, j) => (
              <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "0.688rem" }}>
                <SourceChip id={src.sourceId} label={src.title} />
                <div style={{ flex: 1 }}>
                  {src.title && <span style={{ color: "var(--text-secondary)" }}>{src.title}</span>}
                  {src.snippet && <p style={{ color: "var(--text-muted)", fontSize: "0.625rem", fontStyle: "italic" }}>“{src.snippet}”</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.gaps?.length > 0 && (
        <div style={{ marginTop: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)" }}><strong>Gaps:</strong> {data.gaps.join("; ")}</div>
      )}

      <div style={{ marginTop: "0.5rem" }}><RunMeta result={data} /></div>
    </div>
  );
}
