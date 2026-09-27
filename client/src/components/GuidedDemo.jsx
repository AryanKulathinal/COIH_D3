import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";

export default function GuidedDemo() {
  const { persona, progress } = useSession();
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  if (!persona) return null;

  const done = persona.checklist.filter((c) => progress[c.id]).length;

  return (
    <div className="card" style={{ position: "fixed", right: "1rem", bottom: "1rem", width: open ? "18rem" : "auto", padding: "0.625rem 0.75rem", zIndex: 40, boxShadow: "var(--shadow-lg)" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", width: "100%", background: "none", padding: 0, color: "var(--grey-900)", fontWeight: 600, fontSize: "0.75rem" }}>
        <ListChecks size={14} color="var(--primary)" />
        Guided demo · {done}/{persona.checklist.length}
        <span style={{ marginLeft: "auto" }}>{open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</span>
      </button>
      {open && (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {persona.checklist.map((c, i) => {
            const isDone = Boolean(progress[c.id]);
            return (
              <button key={c.id} onClick={() => navigate(c.to)}
                style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", textAlign: "left", whiteSpace: "normal", background: "none", padding: "0.25rem", borderRadius: "var(--radius-sm)", color: isDone ? "var(--text-muted)" : "var(--grey-800)", fontSize: "0.688rem", fontWeight: 400 }}>
                {isDone ? <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} /> : <Circle size={14} color="var(--grey-400)" style={{ flexShrink: 0, marginTop: 1 }} />}
                <span style={{ textDecoration: isDone ? "line-through" : "none" }}>{i + 1}. {c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
