import { useState } from "react";
import { GraduationCap, RefreshCw, Users, BookOpen, FileText, AlertTriangle, Rocket } from "lucide-react";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { SourceChip } from "../components/SourceDrawer.jsx";
import RunMeta from "../components/RunMeta.jsx";

const RISK = { high: "badge-critical", medium: "badge-high", low: "badge-resolved" };

function Block({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <Icon size={14} color="var(--primary)" /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const { persona, account, accountId, captured, markStep, getCached, setCached } = useSession();
  const [result, setResult] = useState(() => getCached("onboarding"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.onboarding({ accountId, personaId: persona.id, capturedEntries: captured });
      setResult(data);
      setCached("onboarding", data);
      markStep("onboarding");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="fade-in">
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.25rem" }}>Onboarding path</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "1.25rem" }}>A ramp-up built from {account.team}'s real docs, captured knowledge and open work — not a generic template.</p>
        <div className="card" style={{ maxWidth: "28rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
            <GraduationCap size={18} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.813rem", color: "var(--grey-900)" }}>{persona.name} · {persona.role}</div>
              <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Day 1 on {account.name} ({account.client})</div>
            </div>
          </div>
          {error && <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--error-light)", color: "var(--error-dark)", marginBottom: "0.75rem", fontSize: "0.75rem" }}>{error}</div>}
          <button className="btn-primary" onClick={generate} disabled={loading} style={{ width: "100%" }}>
            {loading ? <><span className="spinner" /> Reading the team's docs and knowledge…</> : <><GraduationCap size={13} /> Generate my onboarding path</>}
          </button>
        </div>
      </div>
    );
  }

  const { plan } = result;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Welcome to {account.team}, {persona.name.split(" ")[0]}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", maxWidth: "48rem", marginBottom: "0.25rem" }}>{plan.summary}</p>
          <RunMeta result={result} />
        </div>
        <button className="btn-secondary btn-sm" onClick={generate} disabled={loading}><RefreshCw size={12} /> {loading ? "Regenerating…" : "Regenerate"}</button>
      </div>

      {plan.starterTask && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "3px solid var(--primary)" }}>
          <Rocket size={16} color="var(--primary)" />
          <div style={{ flex: 1, fontSize: "0.75rem" }}><strong style={{ fontWeight: 600 }}>Suggested starter task:</strong> {plan.starterTask.title} — <span style={{ color: "var(--text-secondary)" }}>{plan.starterTask.why}</span></div>
          <SourceChip id={plan.starterTask.sourceId} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plan.weeks?.length || 1, 4)}, 1fr)`, gap: "0.75rem" }}>
        {plan.weeks?.map((w) => (
          <div key={w.week} className="card">
            <div style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>Week {w.week}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.5rem" }}>{w.theme}</div>
            {w.items?.map((it, i) => (
              <div key={i} style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.688rem", fontWeight: 500, color: "var(--grey-800)" }}>{it.title}</div>
                <div style={{ fontSize: "0.625rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{it.detail}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.2rem" }}>
                  {it.sources?.map((s) => <SourceChip key={s.sourceId} id={s.sourceId} label={s.title} />)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Block icon={FileText} title="Must-read">
          {plan.mustRead?.map((m) => (
            <div key={m.sourceId} className="data-row" style={{ display: "flex", gap: "0.5rem", fontSize: "0.688rem", alignItems: "flex-start" }}>
              <SourceChip id={m.sourceId} />
              <span><strong style={{ fontWeight: 500 }}>{m.title}</strong> — <span style={{ color: "var(--text-secondary)" }}>{m.why}</span></span>
            </div>
          ))}
        </Block>
        <Block icon={BookOpen} title="Knowledge you inherit on day 1">
          {plan.knowledgeHighlights?.map((k) => (
            <div key={k.kbId} className="data-row" style={{ display: "flex", gap: "0.5rem", fontSize: "0.688rem", alignItems: "flex-start" }}>
              <SourceChip id={k.kbId} />
              <span><strong style={{ fontWeight: 500 }}>{k.title}</strong> — <span style={{ color: "var(--text-secondary)" }}>{k.why}</span></span>
            </div>
          ))}
        </Block>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Block icon={Users} title="People to know">
          {plan.peopleToKnow?.map((p) => (
            <div key={p.name} className="data-row" style={{ fontSize: "0.688rem" }}>
              <strong style={{ fontWeight: 600 }}>{p.name}</strong> <span style={{ color: "var(--text-muted)" }}>· {p.role}</span>
              <div style={{ color: "var(--text-secondary)" }}>Ask about: {p.askAbout}</div>
            </div>
          ))}
        </Block>
        <Block icon={AlertTriangle} title="Knowledge-ownership map (who holds what)">
          {plan.ownershipMap?.map((o) => (
            <div key={o.component} className="data-row" style={{ display: "flex", gap: "0.5rem", fontSize: "0.688rem", alignItems: "flex-start" }}>
              <span className={`badge ${RISK[o.risk] || "badge-low"}`} style={{ flexShrink: 0 }}>{o.risk} risk</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontWeight: 600 }}>{o.component}</strong> <span style={{ color: "var(--text-muted)" }}>· {o.owners?.join(", ")} · {o.kbEntries} KB entries</span>
                <div style={{ color: "var(--text-secondary)" }}>{o.note}</div>
              </div>
            </div>
          ))}
        </Block>
      </div>
    </div>
  );
}
