import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Siren, CheckCircle2, BookOpen, AlertTriangle, Sparkles, Check, X, ArrowRight } from "lucide-react";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { config } from "../data.js";
import { SourceChip } from "../components/SourceDrawer.jsx";
import RunMeta from "../components/RunMeta.jsx";

const fmt = (ts) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const FIELDS = [
  ["symptom", "Symptom"],
  ["rootCause", "Root cause"],
  ["resolution", "Resolution steps"],
  ["prevention", "Prevention"],
];

function DraftReview({ capture, onPublish, onDiscard }) {
  const [draft, setDraft] = useState(capture.entry);
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="card fade-in" style={{ borderLeft: "3px solid var(--success)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
        <Sparkles size={14} color="var(--success)" />
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)" }}>Knowledge entry drafted automatically</span>
        <span className="badge badge-open" style={{ marginLeft: "auto" }}>draft · needs your confirmation</span>
      </div>
      <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.625rem" }}>
        The capture engine read {capture.sourcesRead?.length || 0} records ({capture.sourcesRead?.join(", ")}) plus the resolution note. Nobody wrote a wiki page. Edit anything, then publish.
      </p>
      <label style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)" }}>TITLE</label>
      <input value={draft.title || ""} onChange={set("title")} style={{ marginBottom: "0.5rem", fontWeight: 500 }} />
      {FIELDS.map(([k, label]) => (
        <div key={k} style={{ marginBottom: "0.5rem" }}>
          <label style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</label>
          <textarea value={draft[k] || ""} onChange={set(k)} rows={k === "resolution" ? 5 : 2} style={{ resize: "vertical" }} />
        </div>
      ))}
      {draft.misleadingHypotheses?.length > 0 && (
        <div style={{ fontSize: "0.688rem", color: "var(--grey-700)", marginBottom: "0.5rem" }}>
          <strong style={{ fontWeight: 600 }}>Dead ends recorded so nobody repeats them:</strong> {draft.misleadingHypotheses.join(" · ")}
        </div>
      )}
      {draft.contradicts?.length > 0 && (
        <div style={{ display: "flex", gap: "0.375rem", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--warning-light)", fontSize: "0.688rem", color: "var(--warning-dark)", marginBottom: "0.5rem" }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Outdated knowledge flagged:</strong>{" "}
            {draft.contradicts.map((c) => <span key={c.sourceId}><SourceChip id={c.sourceId} /> {c.note} </span>)}
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.625rem" }}>
        {draft.evidence?.map((e) => <SourceChip key={e.sourceId} id={e.sourceId} label={e.title} />)}
        {draft.tags?.map((t) => <span key={t} className="badge badge-low">#{t}</span>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button className="btn-success" onClick={() => onPublish(draft)}><Check size={13} /> Confirm & publish</button>
        <button className="btn-secondary" onClick={onDiscard}><X size={13} /> Discard</button>
        <span style={{ marginLeft: "auto" }}><RunMeta result={capture} /></span>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const { persona, accountId, seed, knowledge, incidentState, setIncident, publishEntry, markStep } = useSession();
  const incidents = useMemo(() => seed.sources.filter((s) => s.sourceType === "incident").map((i) => ({ ...i, ...incidentState[i.sourceId] })).reverse(), [seed, incidentState]);
  const kbFor = (id) => knowledge.find((k) => k.capturedFrom === id);

  const [selectedId, setSelectedId] = useState(() => incidents.find((i) => i.status === "open")?.sourceId || incidents[0]?.sourceId);
  const selected = incidents.find((i) => i.sourceId === selectedId);
  const prefill = config.demo.resolutionPrefill[selectedId];
  const [note, setNote] = useState(prefill?.note || "");
  const [capturing, setCapturing] = useState(false);
  const [capture, setCapture] = useState(null);
  const [error, setError] = useState(null);
  const [published, setPublished] = useState(null);

  const resolved = incidents.filter((i) => i.status === "resolved");
  const captureRate = resolved.length ? Math.round((resolved.filter((i) => kbFor(i.sourceId)).length / resolved.length) * 100) : 0;
  const thread = selected ? seed.sources.filter((s) => s.sourceId !== selected.sourceId && ((selected.thread && s.thread === selected.thread) || s.body.includes(selected.sourceId))) : [];

  function select(id) {
    setSelectedId(id);
    setNote(config.demo.resolutionPrefill[id]?.note || "");
    setCapture(null);
    setError(null);
    setPublished(null);
  }

  async function runCapture(resolutionNote) {
    setCapturing(true);
    setError(null);
    try {
      setCapture(await api.capture({ accountId, incidentId: selectedId, resolutionNote, resolvedBy: persona.userId }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCapturing(false);
    }
  }

  async function resolve() {
    setIncident(selectedId, { status: "resolved", resolvedBy: persona.userId, resolvedAt: new Date().toISOString(), resolutionNote: note });
    await runCapture(note); // capture is automatic — resolving is the only action
  }

  function publish(draft) {
    const entry = { ...draft, status: "confirmed", confirmedBy: persona.userId, capturedAt: new Date().toISOString() };
    publishEntry(entry);
    setPublished(entry);
    setCapture(null);
    markStep("resolve");
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Incidents</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Close an incident the way you normally would — the hub captures what was learned automatically.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { label: "Open", value: incidents.filter((i) => i.status === "open").length, color: "var(--error)" },
            { label: "Resolved", value: resolved.length, color: "var(--success)" },
            { label: "Capture rate", value: `${captureRate}%`, color: "var(--primary)" },
          ].map((m) => (
            <div key={m.label} className="card" style={{ padding: "0.375rem 0.75rem", textAlign: "center" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: m.color, lineHeight: 1.2 }}>{m.value}</div>
              <div style={{ fontSize: "0.563rem", color: "var(--text-muted)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "20rem 1fr", gap: "1rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {incidents.map((inc) => {
            const kb = kbFor(inc.sourceId);
            const active = inc.sourceId === selectedId;
            return (
              <button key={inc.sourceId} onClick={() => select(inc.sourceId)} className="card"
                style={{ textAlign: "left", whiteSpace: "normal", padding: "0.625rem 0.75rem", borderColor: active ? "var(--primary)" : "var(--border)", background: active ? "var(--primary-light)" : "var(--white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
                  {inc.status === "open" ? <Siren size={12} color="var(--error)" /> : <CheckCircle2 size={12} color="var(--success)" />}
                  <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--primary)" }}>{inc.sourceId}</span>
                  <span className={`badge badge-${inc.status}`} style={{ marginLeft: "auto" }}>{inc.status}</span>
                </div>
                <div style={{ fontSize: "0.719rem", fontWeight: 500, color: "var(--grey-900)", lineHeight: 1.4 }}>{inc.subject}</div>
                <div style={{ fontSize: "0.625rem", marginTop: "0.25rem", color: kb ? "var(--success)" : inc.status === "resolved" ? "var(--warning-dark)" : "var(--text-muted)" }}>
                  {kb ? `✓ Captured → ${kb.id}` : inc.status === "resolved" ? "⚠ Resolved, knowledge not captured" : `${fmt(inc.timestamp)} · ${inc.component}`}
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>{selected.sourceId}</span>
                <span className={`badge badge-${selected.priority}`}>{selected.priority}</span>
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginLeft: "auto" }}>{selected.component} · {fmt(selected.timestamp)}</span>
              </div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.375rem" }}>{selected.subject}</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{selected.body}</p>
              {thread.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Incident thread ({thread.length})</div>
                  {thread.map((t) => (
                    <div key={t.sourceId} className="data-row" style={{ display: "flex", gap: "0.5rem", fontSize: "0.688rem", alignItems: "flex-start" }}>
                      <span style={{ width: "5.5rem", flexShrink: 0, color: "var(--text-muted)" }}>{fmt(t.timestamp)}</span>
                      <span style={{ width: "5rem", flexShrink: 0, fontWeight: 500, color: "var(--grey-700)" }}>{t.from}</span>
                      <span style={{ flex: 1, color: "var(--grey-800)" }}>{t.body}</span>
                      <SourceChip id={t.sourceId} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected.status === "open" && !capture && !capturing && (
              <div className="card">
                <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.125rem" }}>Resolve incident</h3>
                <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>The closing note you'd write in the ticket anyway. {prefill && "Prefilled for the demo — edit freely."}</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} maxLength={3000} placeholder="What was the root cause and what fixed it?" />
                <button className="btn-primary" disabled={!note.trim()} onClick={resolve} style={{ marginTop: "0.5rem" }}>
                  <CheckCircle2 size={13} /> Mark resolved
                </button>
              </div>
            )}

            {selected.status === "resolved" && !kbFor(selected.sourceId) && !capture && !capturing && (
              <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertTriangle size={16} color="var(--warning-dark)" />
                <div style={{ flex: 1, fontSize: "0.75rem", color: "var(--grey-800)" }}>
                  Resolved before capture was switched on — the fix only lives in chat. {selected.metadata?.resolvedBy && `Only ${selected.metadata.resolvedBy} knows it.`}
                </div>
                <button className="btn-primary" onClick={() => runCapture(selected.resolutionNote || "")}><Sparkles size={13} /> Capture from threads</button>
              </div>
            )}

            {capturing && (
              <div className="card fade-in" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="spinner" />
                <span style={{ fontSize: "0.75rem", color: "var(--grey-800)" }}>Capture engine is reading the incident, its thread and related docs, and drafting a knowledge entry…</span>
              </div>
            )}

            {error && <div className="card" style={{ color: "var(--error-dark)", fontSize: "0.75rem" }}>{error} <button className="btn-secondary btn-sm" onClick={() => runCapture(note)}>Retry capture</button></div>}

            {capture && <DraftReview capture={capture} onPublish={publish} onDiscard={() => setCapture(null)} />}

            {(published || kbFor(selected.sourceId)) && !capture && (
              <div className="card fade-in" style={{ display: "flex", alignItems: "center", gap: "0.625rem", borderLeft: "3px solid var(--success)" }}>
                <BookOpen size={16} color="var(--success)" />
                <div style={{ flex: 1, fontSize: "0.75rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--grey-900)" }}>{(published || kbFor(selected.sourceId)).title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.688rem" }}>
                    In the knowledge base as <SourceChip id={(published || kbFor(selected.sourceId)).id} /> — answerable by anyone on this account from now on.
                  </div>
                </div>
                <Link to="/ask" className="btn-outline btn-sm">Ask about it <ArrowRight size={12} /></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
