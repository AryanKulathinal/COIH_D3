import { useState, useEffect } from "react";
import { Mail, MessageSquare, Ticket, FileText, Video, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { api } from "../services/api.js";

const TYPE_CONFIG = {
  email: { icon: Mail, color: "var(--primary)", label: "Emails" },
  chat: { icon: MessageSquare, color: "var(--bondi-blue)", label: "Chats" },
  ticket: { icon: Ticket, color: "var(--warning-dark)", label: "Tickets" },
  document: { icon: FileText, color: "var(--purple)", label: "Documents" },
  meeting: { icon: Video, color: "var(--error)", label: "Meetings" },
  calendar: { icon: Calendar, color: "var(--success)", label: "Calendar" },
};

const PRIORITY_CONFIG = {
  critical: { color: "var(--error-dark)", bg: "var(--error-light)" },
  high: { color: "var(--warning-dark)", bg: "var(--warning-light)" },
  medium: { color: "var(--primary)", bg: "var(--primary-light)" },
  low: { color: "var(--grey-600)", bg: "var(--grey-300)" },
};

export default function Infographic({ leaveStart, leaveEnd }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getInfographic({ leaveStart, leaveEnd }).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "2rem 0", color: "var(--text-muted)" }}><div className="spinner" /> Loading infographic...</div>;
  if (!data) return null;

  const maxDay = Math.max(...Object.values(data.byDay));
  const totalPriority = Object.values(data.byPriority).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Source Breakdown */}
      <div className="card">
        <h3 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Activity by Source</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {Object.entries(data.byType).map(([type, count]) => {
            const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--grey-200)" }}>
                <Icon size={14} color={cfg.color} />
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--grey-900)", lineHeight: 1.2 }}>{count}</div>
                  <div style={{ fontSize: "0.563rem", color: "var(--text-secondary)" }}>{cfg.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Priority Distribution */}
        <div className="card">
          <h3 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Priority Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {Object.entries(data.byPriority).map(([level, count]) => {
              const cfg = PRIORITY_CONFIG[level];
              const pct = totalPriority > 0 ? (count / totalPriority) * 100 : 0;
              return (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.625rem", fontWeight: 500, color: cfg.color, width: "3.5rem", textTransform: "capitalize" }}>{level}</span>
                  <div style={{ flex: 1, height: "0.5rem", borderRadius: 3, background: "var(--border-light)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--grey-700)", width: "1.5rem", textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Numbers */}
        <div className="card">
          <h3 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Key Numbers</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { label: "Total Items", value: data.summary.totalItems, icon: FileText, color: "var(--primary)" },
              { label: "Action Needed", value: data.actionItems.length, icon: AlertTriangle, color: "var(--error)" },
              { label: "Resolved", value: data.resolvedItems.length, icon: CheckCircle, color: "var(--success)" },
              { label: "Mentions You", value: data.summary.mentionsUser, icon: Clock, color: "var(--warning-dark)" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ textAlign: "center", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--grey-200)" }}>
                  <Icon size={14} color={item.color} style={{ margin: "0 auto 0.25rem" }} />
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--grey-900)", lineHeight: 1.2 }}>{item.value}</div>
                  <div style={{ fontSize: "0.563rem", color: "var(--text-secondary)" }}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="card">
        <h3 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Daily Activity</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.25rem", height: "6rem" }}>
          {Object.entries(data.byDay).map(([day, count]) => (
            <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.563rem", fontWeight: 600, color: "var(--grey-700)" }}>{count}</span>
              <div style={{
                width: "100%", maxWidth: "2rem",
                height: `${(count / maxDay) * 100}%`, minHeight: "0.25rem",
                background: "var(--primary)", borderRadius: "3px 3px 0 0",
                transition: "height 0.5s",
              }} />
              <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Key Events Timeline</h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.timeline.map((item, i) => {
            const cfg = TYPE_CONFIG[item.sourceType] || TYPE_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "start", gap: "0.625rem", padding: "0.375rem 0", borderBottom: i < data.timeline.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", width: "2.5rem", flexShrink: 0, paddingTop: "0.125rem" }}>{item.date}</div>
                <div style={{ width: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "0.25rem" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Icon size={11} color={cfg.color} />
                    <span style={{ fontSize: "0.688rem", fontWeight: 500, color: "var(--grey-800)" }}>{item.subject}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.125rem" }}>
                    <span style={{ fontSize: "0.563rem", color: "var(--primary)" }}>{item.sourceId}</span>
                    {item.priority && <span className={`badge badge-${item.priority}`}>{item.priority}</span>}
                    {item.status === "resolved" && <span className="badge badge-resolved">resolved</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
