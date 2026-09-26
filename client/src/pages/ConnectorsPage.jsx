import { useState, useEffect } from "react";
import { Mail, MessageSquare, Ticket, FileText, Video, Calendar, Plus, RefreshCw, Power, ChevronDown, ChevronRight, Trash2, Upload, X } from "lucide-react";
import { api } from "../services/api.js";

const SOURCE_CONFIG = {
  email: { label: "Email", icon: Mail, color: "#006e74", platforms: ["Microsoft Outlook", "Gmail", "IMAP"] },
  chat: { label: "Chat", icon: MessageSquare, color: "#0097ac", platforms: ["Microsoft Teams", "Slack", "Google Chat"] },
  ticket: { label: "Tickets", icon: Ticket, color: "#a76700", platforms: ["Jira", "ServiceNow", "Azure DevOps"] },
  document: { label: "Documents", icon: FileText, color: "#881e87", platforms: ["Confluence", "SharePoint", "Google Drive"] },
  meeting: { label: "Meetings", icon: Video, color: "#fc6a59", platforms: ["Microsoft Teams", "Zoom", "Google Meet"] },
  calendar: { label: "Calendar", icon: Calendar, color: "#01b27c", platforms: ["Outlook Calendar", "Google Calendar"] },
};

const FORM_FIELDS = {
  email: [
    { key: "from", label: "From", placeholder: "sender@company.com" },
    { key: "to", label: "To (comma-separated)", placeholder: "recipient@company.com" },
    { key: "subject", label: "Subject", placeholder: "Email subject line" },
    { key: "body", label: "Body", placeholder: "Email content...", multiline: true },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "critical"] },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "tag1, tag2" },
    { key: "mentionsUser", label: "Mentions the returning user", type: "checkbox" },
    { key: "requiresAction", label: "Requires action", type: "checkbox" },
  ],
  chat: [
    { key: "from", label: "From", placeholder: "username" },
    { key: "channel", label: "Channel", placeholder: "#team-channel" },
    { key: "body", label: "Message", placeholder: "Chat message content...", multiline: true },
    { key: "thread", label: "Thread ID", placeholder: "thread-id (group related messages)" },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "tag1, tag2" },
    { key: "mentionsUser", label: "Mentions the returning user", type: "checkbox" },
  ],
  ticket: [
    { key: "sourceId", label: "Ticket ID", placeholder: "JIRA-1234" },
    { key: "from", label: "Reporter", placeholder: "reporter.name" },
    { key: "subject", label: "Title", placeholder: "Ticket summary" },
    { key: "body", label: "Description", placeholder: "Ticket details...", multiline: true },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "critical"] },
    { key: "status", label: "Status", type: "select", options: ["open", "pending", "resolved", "closed"] },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "bug, feature, incident" },
    { key: "mentionsUser", label: "Assigned to returning user", type: "checkbox" },
    { key: "requiresAction", label: "Requires action", type: "checkbox" },
  ],
  document: [
    { key: "from", label: "Author", placeholder: "author.name" },
    { key: "subject", label: "Document Title", placeholder: "Architecture Decision Record - ..." },
    { key: "body", label: "Content", placeholder: "Document content...", multiline: true },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "adr, design, runbook" },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
  ],
  meeting: [
    { key: "from", label: "Organizer", placeholder: "organizer.name" },
    { key: "to", label: "Attendees (comma-separated)", placeholder: "person1, person2" },
    { key: "subject", label: "Meeting Title", placeholder: "Sprint Planning - Team Alpha" },
    { key: "body", label: "Transcript / Notes", placeholder: "Paste meeting transcript or notes here...\n\n[00:02] Speaker: ...\n[00:05] Speaker: ...\n\nACTION ITEMS:\n- ...", multiline: true, rows: 12 },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "sprint-planning, decisions, action-items" },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
    { key: "mentionsUser", label: "Mentions the returning user", type: "checkbox" },
    { key: "requiresAction", label: "Has action items for returning user", type: "checkbox" },
  ],
  calendar: [
    { key: "from", label: "Organizer", placeholder: "organizer@company.com" },
    { key: "to", label: "Attendees (comma-separated)", placeholder: "attendee1, attendee2" },
    { key: "subject", label: "Event Title", placeholder: "Q2 SLA Review Meeting" },
    { key: "body", label: "Description / Agenda", placeholder: "Meeting agenda and notes...", multiline: true },
    { key: "tags", label: "Tags (comma-separated)", placeholder: "meeting, client, review" },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
    { key: "mentionsUser", label: "User is invited", type: "checkbox" },
    { key: "requiresAction", label: "Requires preparation", type: "checkbox" },
  ],
};

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState([]);
  const [expandedType, setExpandedType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [recentEntries, setRecentEntries] = useState({});
  const [syncing, setSyncing] = useState({});
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [newConnector, setNewConnector] = useState({ sourceType: "email", platform: "", name: "" });

  useEffect(() => {
    loadConnectors();
  }, []);

  async function loadConnectors() {
    try {
      const data = await api.getConnectors();
      setConnectors(data);
    } catch (e) {
      console.error("Failed to load connectors:", e);
    }
  }

  async function loadEntries(sourceType) {
    try {
      const entries = await api.getDataEntries(sourceType, 10);
      setRecentEntries((prev) => ({ ...prev, [sourceType]: entries }));
    } catch (e) {
      console.error("Failed to load entries:", e);
    }
  }

  function toggleExpand(sourceType) {
    if (expandedType === sourceType) {
      setExpandedType(null);
    } else {
      setExpandedType(sourceType);
      loadEntries(sourceType);
    }
  }

  async function handleToggle(id) {
    await api.toggleConnector(id);
    loadConnectors();
  }

  async function handleSync(id, sourceType) {
    setSyncing((p) => ({ ...p, [id]: true }));
    await api.syncConnector(id);
    setTimeout(() => {
      setSyncing((p) => ({ ...p, [id]: false }));
      loadConnectors();
      loadEntries(sourceType);
    }, 2000);
  }

  async function handleSubmitEntry(sourceType) {
    const fields = FORM_FIELDS[sourceType];
    const entry = { sourceType, timestamp: formData.timestamp || new Date().toISOString() };

    for (const field of fields) {
      const val = formData[field.key];
      if (!val && val !== true) continue;

      if (field.key === "to" || field.key === "tags") {
        entry[field.key] = val.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (field.type === "checkbox") {
        entry[field.key] = !!val;
      } else {
        entry[field.key] = val;
      }
    }

    if (!entry.body) {
      alert("Content/body is required");
      return;
    }

    try {
      await api.addDataEntry(entry);
      setFormData({});
      setShowAddForm(null);
      loadConnectors();
      loadEntries(sourceType);
    } catch (e) {
      alert("Failed to add entry: " + e.message);
    }
  }

  async function handleDeleteEntry(id, sourceType) {
    await api.deleteDataEntry(id);
    loadEntries(sourceType);
    loadConnectors();
  }

  async function handleAddConnector() {
    if (!newConnector.name || !newConnector.platform) return;
    await api.addConnector({
      name: newConnector.name,
      sourceType: newConnector.sourceType,
      platform: newConnector.platform.toLowerCase().replace(/\s+/g, "-"),
      status: "connected",
      config: { authType: "manual" },
    });
    setShowAddConnector(false);
    setNewConnector({ sourceType: "email", platform: "", name: "" });
    loadConnectors();
  }

  return (
    <div className="fade-in" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--grey-900)" }}>Data Connectors</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            Connect your data sources and add entries directly. All data flows into the intelligence hub.
          </p>
        </div>
        <button onClick={() => setShowAddConnector(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            background: "var(--primary)", color: "#ffffff", border: "none",
            padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "0.75rem",
            fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif",
          }}>
          <Plus size={16} /> Add Connector
        </button>
      </div>

      {showAddConnector && (
        <div className="fade-in" style={{
          marginBottom: "1.5rem", borderLeft: "3px solid var(--primary)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderLeftWidth: "3px", borderLeftColor: "var(--primary)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)",
          padding: "1.25rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)" }}>Add New Connector</h3>
            <button onClick={() => setShowAddConnector(false)} style={{ background: "none", padding: "0.25rem", border: "none", cursor: "pointer" }}><X size={18} color="var(--text-muted)" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Type</label>
              <select value={newConnector.sourceType} onChange={(e) => setNewConnector((p) => ({ ...p, sourceType: e.target.value }))}
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }}>
                {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform Name</label>
              <input value={newConnector.name} onChange={(e) => setNewConnector((p) => ({ ...p, name: e.target.value, platform: e.target.value }))}
                placeholder="e.g. Slack, GitHub, Datadog" style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested</label>
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                {(SOURCE_CONFIG[newConnector.sourceType]?.platforms || []).map((p) => (
                  <button key={p} onClick={() => setNewConnector((prev) => ({ ...prev, name: p, platform: p }))}
                    style={{
                      fontSize: "0.65rem", padding: "0.2rem 0.5rem",
                      background: "transparent", border: "1px solid var(--border)",
                      borderRadius: "6px", cursor: "pointer", color: "var(--grey-900)",
                      fontFamily: "Poppins, sans-serif",
                    }}>{p}</button>
                ))}
              </div>
            </div>
            <button onClick={handleAddConnector} style={{
              height: 38, background: "var(--primary)", color: "#ffffff",
              border: "none", borderRadius: "9999px", padding: "0 1rem",
              fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
            }}>Add</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {connectors.map((conn) => {
          const cfg = SOURCE_CONFIG[conn.sourceType] || SOURCE_CONFIG.document;
          const Icon = cfg.icon;
          const isExpanded = expandedType === conn.sourceType;
          const isFormOpen = showAddForm === conn.sourceType;
          const entries = recentEntries[conn.sourceType] || [];

          return (
            <div key={conn._id} style={{
              padding: 0, overflow: "hidden",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={cfg.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--grey-900)" }}>{conn.name}</span>
                    <span style={{
                      padding: "0.15rem 0.5rem", borderRadius: 9999, fontSize: "0.65rem", fontWeight: 600,
                      background: conn.status === "connected" ? "var(--success-light)" : conn.status === "syncing" ? "var(--primary-light)" : "var(--grey-300)",
                      color: conn.status === "connected" ? "var(--success)" : conn.status === "syncing" ? "var(--primary)" : "var(--grey-600)",
                    }}>
                      {conn.status === "syncing" ? "Syncing..." : conn.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "flex", gap: "1rem", marginTop: "0.125rem" }}>
                    <span>{conn.stats?.count || 0} items indexed</span>
                    {conn.config?.lastSyncAt && <span>Last sync: {new Date(conn.config.lastSyncAt).toLocaleString()}</span>}
                    <span>Auth: {conn.config?.authType || "manual"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button onClick={() => handleSync(conn._id, conn.sourceType)}
                    disabled={syncing[conn._id]} style={{
                      padding: "0.375rem 0.625rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem",
                      background: "transparent", border: "1px solid var(--border)", borderRadius: "6px",
                      cursor: "pointer", color: "var(--grey-900)", fontFamily: "Poppins, sans-serif",
                    }}>
                    <RefreshCw size={13} className={syncing[conn._id] ? "spin" : ""} /> Sync
                  </button>
                  <button onClick={() => { setShowAddForm(isFormOpen ? null : conn.sourceType); if (!isExpanded) toggleExpand(conn.sourceType); }}
                    style={{
                      padding: "0.375rem 0.625rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem",
                      background: "transparent", border: "1px solid var(--border)", borderRadius: "6px",
                      cursor: "pointer", color: "var(--grey-900)", fontFamily: "Poppins, sans-serif",
                    }}>
                    <Plus size={13} /> Add Data
                  </button>
                  <button onClick={() => handleToggle(conn._id)}
                    style={{
                      padding: "0.375rem 0.625rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem",
                      background: "transparent", border: "1px solid var(--border)", borderRadius: "6px",
                      cursor: "pointer", fontFamily: "Poppins, sans-serif",
                      color: conn.status === "connected" ? "var(--success)" : "var(--text-muted)",
                    }}>
                    <Power size={13} />
                  </button>
                  <button onClick={() => toggleExpand(conn.sourceType)}
                    style={{
                      padding: "0.375rem", fontSize: "0.75rem",
                      background: "transparent", border: "1px solid var(--border)", borderRadius: "6px",
                      cursor: "pointer", color: "var(--grey-900)", fontFamily: "Poppins, sans-serif",
                    }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>

              {isFormOpen && (
                <div className="fade-in" style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ paddingTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.75rem", color: cfg.color }}>
                      Add {cfg.label} Entry
                    </h4>

                    <div style={{ marginBottom: "0.75rem" }}>
                      <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Timestamp</label>
                      <input type="datetime-local" value={formData.timestamp || ""} onChange={(e) => setFormData((p) => ({ ...p, timestamp: e.target.value }))}
                        style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {FORM_FIELDS[conn.sourceType]?.map((field) => {
                        if (field.type === "checkbox") {
                          return (
                            <label key={field.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", cursor: "pointer", color: "var(--grey-900)" }}>
                              <input type="checkbox" checked={!!formData[field.key]}
                                onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.checked }))}
                                style={{ width: "auto" }} />
                              {field.label}
                            </label>
                          );
                        }
                        if (field.type === "select") {
                          return (
                            <div key={field.key}>
                              <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                              <select value={formData[field.key] || ""} onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                                style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }}>
                                <option value="">Select...</option>
                                {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        }
                        if (field.multiline) {
                          return (
                            <div key={field.key} style={{ gridColumn: "1 / -1" }}>
                              <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                              <textarea rows={field.rows || 5} value={formData[field.key] || ""} placeholder={field.placeholder}
                                onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                                style={{ resize: "vertical", fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }} />
                            </div>
                          );
                        }
                        return (
                          <div key={field.key}>
                            <label style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                            <input value={formData[field.key] || ""} placeholder={field.placeholder}
                              onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                              style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.75rem" }} />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <button onClick={() => handleSubmitEntry(conn.sourceType)} style={{
                        background: "var(--primary)", color: "#ffffff", border: "none",
                        padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "0.75rem",
                        fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif",
                      }}>
                        Add Entry
                      </button>
                      <button onClick={() => { setShowAddForm(null); setFormData({}); }} style={{
                        background: "transparent", border: "1px solid var(--border)",
                        padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.75rem",
                        cursor: "pointer", color: "var(--grey-900)", fontFamily: "Poppins, sans-serif",
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isExpanded && !isFormOpen && (
                <div className="fade-in" style={{ borderTop: "1px solid var(--border)" }}>
                  {entries.length === 0 ? (
                    <div style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>No entries yet</div>
                  ) : (
                    <div style={{ maxHeight: 300, overflow: "auto" }}>
                      {entries.map((entry, idx) => (
                        <div key={entry._id} className="connector-data-row" style={{
                          padding: "0.75rem 1.25rem", borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                          display: "flex", alignItems: "start", gap: "0.75rem",
                          transition: "background 0.15s ease",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: cfg.color }}>{entry.sourceId}</span>
                              {entry.priority && <span className={`badge badge-${entry.priority}`} style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>{entry.priority}</span>}
                              {entry.status && <span className={`badge badge-${entry.status}`} style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>{entry.status}</span>}
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
                            </div>
                            {entry.subject && <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--grey-900)" }}>{entry.subject}</div>}
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.body?.slice(0, 120)}
                            </div>
                          </div>
                          <button className="delete-entry-btn" onClick={() => handleDeleteEntry(entry._id, conn.sourceType)}
                            style={{ background: "none", padding: "0.25rem", flexShrink: 0, border: "none", cursor: "pointer", color: "var(--text-muted)", transition: "color 0.15s ease" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .connector-data-row:hover { background: var(--ust-gray-100, #f4f8f9); }
        .delete-entry-btn:hover { color: var(--error) !important; }
      `}</style>
    </div>
  );
}
