import { useEffect, useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";
import { useSourceDrawer, SourceChip } from "../components/SourceDrawer.jsx";

const ago = (ts) => {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  return mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
};
const fmt = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function KnowledgePage() {
  const { account, knowledge, captured, markStep } = useSession();
  const open = useSourceDrawer();
  const [q, setQ] = useState("");

  useEffect(() => markStep("kb"), [markStep]);

  const capturedIds = new Set(captured.map((c) => c.id));
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const entries = [...knowledge]
    .reverse()
    .filter((e) => terms.every((t) => JSON.stringify(e).toLowerCase().includes(t)));

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Knowledge base · {account.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            {knowledge.length} entries, every one captured from work that already happened — none written as a wiki page. {captured.length > 0 && `${captured.length} captured in this session.`}
          </p>
        </div>
        <div style={{ position: "relative", width: "16rem" }}>
          <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: "0.5rem", top: "0.55rem" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter entries…" style={{ paddingLeft: "1.75rem" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(22rem, 1fr))", gap: "0.75rem" }}>
        {entries.map((e) => {
          const isNew = capturedIds.has(e.id);
          return (
            <div key={e.id} className="card" onClick={() => open(e.id)} style={{ cursor: "pointer", borderLeft: `3px solid ${isNew ? "var(--success)" : "var(--primary-300)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                <SourceChip id={e.id} />
                <span className="badge badge-low">{e.category}</span>
                {isNew && <span className="badge badge-resolved" style={{ display: "inline-flex", gap: "0.2rem" }}><Sparkles size={10} /> new · {ago(e.capturedAt)}</span>}
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.25rem", display: "flex", gap: "0.375rem" }}>
                <BookOpen size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} /> {e.title}
              </div>
              <p style={{ fontSize: "0.688rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.375rem" }}>{e.symptom}</p>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                From {e.capturedFrom} · {e.components?.join(", ")} · confirmed by {e.confirmedBy} · {fmt(e.capturedAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
