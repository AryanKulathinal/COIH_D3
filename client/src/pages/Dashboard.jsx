import { Link } from "react-router-dom";
import { ArrowRight, Database, BookOpen, Siren, Gauge, Clock, Users, Coins } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";
import { SOURCE_TYPES } from "../data.js";

const NEXT = {
  returning: { to: "/brief", label: "Generate your return-from-leave brief", hint: "Two weeks of mail, chat, Jira, incidents and meetings — reconstructed in under a minute." },
  newjoiner: { to: "/onboarding", label: "Generate your onboarding path", hint: "Start from everything the team has already captured instead of 90 days of asking." },
  daily: { to: "/incidents", label: "Work the live incident INC-7310", hint: "Ask the hub first, resolve it, and watch the fix become knowledge." },
};

function Tile({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "1.125rem", fontWeight: 600, color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{label}{sub && ` · ${sub}`}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { persona, account, seed, knowledge, captured, incidentState, getCached } = useSession();
  const next = NEXT[persona.scenario];
  const incidents = seed.sources.filter((s) => s.sourceType === "incident").map((i) => ({ ...i, ...incidentState[i.sourceId] }));
  const resolved = incidents.filter((i) => i.status === "resolved");
  const captureRate = resolved.length ? Math.round((resolved.filter((i) => knowledge.some((k) => k.capturedFrom === i.sourceId)).length / resolved.length) * 100) : 0;
  const counts = seed.sources.reduce((acc, s) => ({ ...acc, [s.sourceType]: (acc[s.sourceType] || 0) + 1 }), {});
  const brief = getCached("brief");

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Hi {persona.name.split(" ")[0]} — {persona.scenarioLabel.toLowerCase()}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{persona.role} · {account.team} · {account.name} ({account.client}, {account.domain}) · today is {persona.today}</p>
      </div>

      <Link to={next.to} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderLeft: `3px solid ${account.color}`, textDecoration: "none" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>Start here</div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--grey-900)" }}>{next.label}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{next.hint}</div>
        </div>
        <ArrowRight size={18} color="var(--primary)" />
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <Tile icon={Database} label="Records indexed" value={seed.sources.length} color="var(--primary)" sub="7 source types" />
        <Tile icon={BookOpen} label="Knowledge entries" value={knowledge.length} color="var(--success)" sub={captured.length ? `+${captured.length} this session` : "all auto-captured"} />
        <Tile icon={Gauge} label="Incident capture rate" value={`${captureRate}%`} color="var(--primary-450)" sub={`${resolved.length} resolved`} />
        <Tile icon={Siren} label="Open incidents" value={incidents.filter((i) => i.status === "open").length} color="var(--error)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "0.75rem" }}>
        <div className="card">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.625rem" }}>Why it matters</h3>
          {[
            { icon: Clock, title: "3–5 h → under a minute", body: "Manual catch-up per leave instance versus a generated, fully cited brief." },
            { icon: Users, title: "120,000–200,000 hours / year", body: "Leave-return catch-up alone, across a 5,000-person organisation (the pitch baseline)." },
            { icon: Coins, title: brief?.tokenUsage ? `≈ $${brief.tokenUsage.estimatedCost.toFixed(2)} per brief` : "Cents per brief", body: "Measured Claude Sonnet 5 token cost for the brief you generate, shown on every result." },
            { icon: BookOpen, title: "Compounding knowledge", body: "Every resolved incident becomes an entry, so the next person gets an answer instead of an escalation." },
          ].map((r) => (
            <div key={r.title} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <r.icon size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: "0.688rem" }}>
                <strong style={{ fontWeight: 600, color: "var(--grey-900)" }}>{r.title}</strong>
                <div style={{ color: "var(--text-secondary)" }}>{r.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", flex: 1 }}>Connected sources · {account.name}</h3>
            <Link to="/connectors" style={{ fontSize: "0.625rem" }}>How they connect →</Link>
          </div>
          {Object.entries(counts).map(([type, n]) => (
            <div key={type} className="data-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.688rem" }}>
              <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: SOURCE_TYPES[type]?.color }} />
              <span style={{ flex: 1 }}>{SOURCE_TYPES[type]?.label} <span style={{ color: "var(--text-muted)" }}>· {SOURCE_TYPES[type]?.system}</span></span>
              <strong style={{ fontWeight: 600 }}>{n}</strong>
            </div>
          ))}
          <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Synthetic data behind mocked adapters. This account's index is isolated — other accounts are never searched.</p>
        </div>
      </div>
    </div>
  );
}
