import { useState, useEffect } from "react";
import { Database, Check, Edit3, RefreshCw, BookOpen } from "lucide-react";
import { api } from "../services/api.js";

export default function CapturePage() {
  const [incidents, setIncidents] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [capturing, setCapturing] = useState(null);
  const [draftEntry, setDraftEntry] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.getIncidents().then(setIncidents).catch(console.error);
    api.getKnowledge().then(setKnowledge).catch(console.error);
  }, []);

  async function handleCapture(incidentId) {
    setCapturing(incidentId);
    setDraftEntry(null);
    try {
      const result = await api.captureIncident(incidentId);
      setDraftEntry(result.entry);
    } catch (e) {
      alert("Capture failed: " + e.message);
    } finally {
      setCapturing(null);
    }
  }

  async function handleConfirm() {
    if (!draftEntry) return;
    setConfirming(true);
    try {
      await api.confirmEntry({
        entryId: draftEntry._id,
        confirmedBy: "priya.sharma",
      });
      setDraftEntry(null);
      const updated = await api.getKnowledge();
      setKnowledge(updated);
    } catch (e) {
      alert("Confirm failed: " + e.message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fade-in" style={{ fontFamily: "Poppins, sans-serif" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--grey-900)" }}>Knowledge Capture</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
        Convert resolved incidents into searchable knowledge entries — automatically
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--grey-900)" }}>
            <Database size={18} />
            Incidents
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {incidents.map((inc) => (
              <div key={inc.sourceId} style={{
                padding: "1rem",
                background: "var(--bg-card, #ffffff)",
                border: "1px solid var(--border, #d7e0e3)",
                borderRadius: "var(--radius-xl, 12px)",
                boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--primary, #006e74)" }}>{inc.sourceId}</span>
                    <h3 style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--grey-900)" }}>{inc.subject}</h3>
                  </div>
                  <span className={`badge badge-${inc.priority}`}>{inc.priority}</span>
                </div>

                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #707070)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  {inc.body?.slice(0, 150)}...
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge badge-${inc.status || "open"}`}>{inc.status || "open"}</span>
                  <button
                    onClick={() => handleCapture(inc.sourceId)}
                    disabled={capturing === inc.sourceId}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.375rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      background: "var(--primary, #006e74)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "9999px",
                      cursor: capturing === inc.sourceId ? "not-allowed" : "pointer",
                      opacity: capturing === inc.sourceId ? 0.6 : 1,
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {capturing === inc.sourceId ? (
                      <><div className="spinner" style={{ width: 14, height: 14, borderBottomColor: "var(--primary, #006e74)" }} /> Capturing...</>
                    ) : (
                      <><RefreshCw size={12} /> Capture Knowledge</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {draftEntry && (
            <div style={{
              marginBottom: "1.5rem",
              background: "var(--bg-card, #ffffff)",
              border: "1px solid var(--border, #d7e0e3)",
              borderLeft: "3px solid var(--warning, #ffbb00)",
              borderRadius: "var(--radius-xl, 12px)",
              boxShadow: "var(--shadow-sm)",
              padding: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Edit3 size={16} color="var(--warning, #ffbb00)" />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--warning, #ffbb00)" }}>DRAFT — Review & Confirm</span>
              </div>

              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--grey-900)" }}>{draftEntry.title}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #707070)", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: "0.75rem" }}>
                {draftEntry.content}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
                {draftEntry.tags?.map((tag) => (
                  <span key={tag} style={{
                    padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.65rem",
                    background: "var(--primary-light, rgba(0,110,116,0.1))", color: "var(--primary, #006e74)",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {draftEntry.sources?.length > 0 && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted, #a8a8a8)", marginBottom: "1rem" }}>
                  Sources: {draftEntry.sources.map((s) => s.sourceId).join(", ")}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={handleConfirm} disabled={confirming}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    background: "var(--success)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: confirming ? "not-allowed" : "pointer",
                    opacity: confirming ? 0.6 : 1,
                    fontFamily: "Poppins, sans-serif",
                  }}>
                  <Check size={14} />
                  {confirming ? "Confirming..." : "Confirm & Publish"}
                </button>
                <button onClick={() => setDraftEntry(null)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border, #d7e0e3)",
                    borderRadius: "8px",
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "var(--text-secondary, #707070)",
                    cursor: "pointer",
                    fontFamily: "Poppins, sans-serif",
                  }}>
                  Discard
                </button>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--grey-900)" }}>
            <BookOpen size={18} />
            Knowledge Base ({knowledge.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {knowledge.map((entry) => (
              <div key={entry._id} style={{
                padding: "1rem",
                background: "var(--bg-card, #ffffff)",
                border: "1px solid var(--border, #d7e0e3)",
                borderRadius: "var(--radius-xl, 12px)",
                boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.375rem" }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--grey-900)" }}>{entry.title}</h3>
                  <span className={`badge ${entry.status === "confirmed" ? "badge-resolved" : "badge-open"}`}>
                    {entry.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #707070)", lineHeight: 1.5 }}>
                  {entry.content?.slice(0, 200)}...
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem" }}>
                  {entry.tags?.map((tag) => (
                    <span key={tag} style={{
                      padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.65rem",
                      background: "var(--primary-light, rgba(0,110,116,0.1))", color: "var(--primary, #006e74)",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
