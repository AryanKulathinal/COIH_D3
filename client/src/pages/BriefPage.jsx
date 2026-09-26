import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plane, ChevronDown, ChevronRight, ExternalLink, Loader, Coins } from "lucide-react";
import { api } from "../services/api.js";

const SECTION_CONFIG = {
  decisions: { label: "Key Decisions", color: "var(--primary)" },
  workItems: { label: "Your Work Items", color: "var(--primary-450)" },
  openQuestions: { label: "Threads Awaiting Response", color: "var(--warning-dark)" },
  incidents: { label: "Incidents", color: "var(--error)" },
  blockedItems: { label: "Blocked on You", color: "var(--error-dark)" },
};

export default function BriefPage() {
  const { id } = useParams();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (id) api.getBrief(id).then(setBrief).catch((e) => setError(e.message));
  }, [id]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      setBrief(await api.generateBrief({ userId: "priya.sharma", userName: "Priya Sharma", leaveStart: "2025-04-01", leaveEnd: "2025-04-14" }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function toggleSection(key) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!brief && !loading) {
    return (
      <div className="fade-in">
        <h1 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--grey-900)" }}>Return-from-Leave Brief</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "1.25rem" }}>Generate a comprehensive catch-up brief for your leave period</p>
        <div className="card" style={{ maxWidth: "26rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <Plane size={18} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.813rem", color: "var(--grey-900)" }}>Priya Sharma</div>
              <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>1 Apr 2025 – 14 Apr 2025 (2 weeks)</div>
            </div>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            This will analyze all emails, chats, tickets, documents, meetings, and calendar events from your leave period and generate a structured brief with action items.
          </p>
          {error && <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--error-light)", color: "var(--error-dark)", marginBottom: "0.75rem", fontSize: "0.75rem" }}>{error}</div>}
          <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: "100%" }}>
            {loading ? <><span className="spinner" /> Generating Brief (15-30s)...</> : <><Plane size={13} /> Generate Brief</>}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "18.75rem", gap: "0.625rem" }}>
        <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Claude is analyzing your data sources...</div>
        <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Querying emails, chats, tickets, documents, meetings, and calendar</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Welcome back, {brief.userName}!</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            Here's what changed ({new Date(brief.leaveStart).toLocaleDateString()} – {new Date(brief.leaveEnd).toLocaleDateString()})
          </p>
        </div>
        {brief.tokenUsage && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            <Coins size={11} />
            {(brief.tokenUsage.inputTokens + brief.tokenUsage.outputTokens).toLocaleString()} tokens | ${brief.tokenUsage.estimatedCost?.toFixed(4)}
          </div>
        )}
      </div>

      {brief.overview && (
        <div className="card" style={{ marginBottom: "0.75rem", borderLeft: "3px solid var(--primary)" }}>
          <div style={{ fontSize: "0.563rem", fontWeight: 600, color: "var(--primary)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overview</div>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{brief.overview}</p>
        </div>
      )}

      {brief.stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {[
            { label: "Decisions", value: brief.stats.keyDecisions, color: "var(--primary)" },
            { label: "Action Items", value: brief.stats.actionItems, color: "var(--error)" },
            { label: "Emails", value: brief.stats.totalEmails, color: "var(--primary-450)" },
            { label: "Chats", value: brief.stats.totalChats, color: "var(--bondi-blue)" },
            { label: "Tickets", value: brief.stats.totalTickets, color: "var(--warning-dark)" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "0.625rem 0.5rem" }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 600, color: s.color, lineHeight: 1.2 }}>{s.value || 0}</div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {brief.sections && Object.entries(SECTION_CONFIG).map(([key, config]) => {
        const section = brief.sections[key];
        if (!section?.items?.length) return null;
        const isExpanded = expandedSections[key] !== false;
        return (
          <div key={key} className="card" style={{ marginBottom: "0.5rem" }}>
            <div onClick={() => toggleSection(key)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", marginBottom: isExpanded ? "0.625rem" : 0 }}>
              {isExpanded ? <ChevronDown size={14} color="var(--grey-600)" /> : <ChevronRight size={14} color="var(--grey-600)" />}
              <div style={{ width: 3, height: 14, borderRadius: 2, background: config.color }} />
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, flex: 1, color: "var(--grey-900)" }}>{config.label}</h3>
              <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{section.items.length}</span>
            </div>
            {isExpanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ padding: "0.625rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", background: "var(--grey-100)" }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: "0.75rem", marginBottom: "0.188rem", color: "var(--grey-900)" }}>{item.summary}</div>
                        {item.detail && <p style={{ fontSize: "0.688rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.detail}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                        {item.priority && <span className={`badge badge-${item.priority}`}>{item.priority}</span>}
                        {item.status && <span className={`badge badge-${item.status}`}>{item.status.replace("_", " ")}</span>}
                      </div>
                    </div>
                    {item.sources?.length > 0 && (
                      <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {item.sources.map((src, j) => (
                          <span key={j} style={{
                            display: "inline-flex", alignItems: "center", gap: "0.188rem",
                            padding: "0.063rem 0.375rem", borderRadius: "var(--radius-sm)", fontSize: "0.625rem",
                            background: "var(--primary-light)", color: "var(--primary)",
                          }}>
                            <ExternalLink size={9} />{src.sourceId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
