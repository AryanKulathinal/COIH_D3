import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, Ticket, AlertTriangle, Clock, ArrowRight, Video, FileText, Zap, Plane } from "lucide-react";
import { api } from "../services/api.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
    api.getBriefs().then(setBriefs).catch(console.error);
  }, []);

  const sourceConfig = {
    email: { icon: Mail, color: "var(--primary)", bg: "var(--primary-light)" },
    chat: { icon: MessageSquare, color: "var(--bondi-blue)", bg: "#e6f6f8" },
    ticket: { icon: Ticket, color: "var(--warning-dark)", bg: "var(--warning-light)" },
    document: { icon: FileText, color: "var(--purple)", bg: "var(--purple-light)" },
    meeting: { icon: Video, color: "var(--error)", bg: "var(--error-light)" },
    calendar: { icon: Clock, color: "var(--success)", bg: "var(--success-light)" },
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.125rem" }}>Welcome back, Priya</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Here's your operational intelligence dashboard</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(9.5rem, 1fr))", gap: "0.625rem", marginBottom: "1rem" }}>
        {stats?.sources?.map((s) => {
          const cfg = sourceConfig[s._id] || sourceConfig.document;
          const Icon = cfg.icon;
          return (
            <div key={s._id} className="card" style={{ padding: "0.625rem 0.75rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div style={{
                width: "2.125rem", height: "2.125rem", borderRadius: "var(--radius-md)",
                background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={15} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--grey-900)", lineHeight: 1.2 }}>{s.count}</div>
                <div style={{ fontSize: "0.625rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{s._id}s</div>
              </div>
            </div>
          );
        })}
        {stats && (
          <div className="card" style={{ padding: "0.625rem 0.75rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: "2.125rem", height: "2.125rem", borderRadius: "var(--radius-md)",
              background: "var(--error-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AlertTriangle size={15} color="var(--error)" />
            </div>
            <div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--grey-900)", lineHeight: 1.2 }}>{stats.actionItems}</div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-secondary)" }}>Action Items</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <button className="btn-primary" style={{ justifyContent: "space-between", width: "100%" }} onClick={() => navigate("/brief")}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Zap size={12} /> Generate Return-from-Leave Brief</span>
              <ArrowRight size={12} />
            </button>
            <button className="btn-outline" style={{ justifyContent: "space-between", width: "100%" }} onClick={() => navigate("/qa")}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><MessageSquare size={12} /> Ask a Question</span>
              <ArrowRight size={12} />
            </button>
            <button className="btn-secondary" style={{ justifyContent: "space-between", width: "100%" }} onClick={() => navigate("/capture")}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><FileText size={12} /> Capture Knowledge from Incident</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>Recent Briefs</h2>
          {briefs.length === 0 ? (
            <div style={{ padding: "1.25rem 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <Plane size={24} color="var(--grey-400)" style={{ margin: "0 auto 0.375rem" }} />
              <p>No briefs generated yet.</p>
              <p style={{ fontSize: "0.688rem" }}>Generate your first return-from-leave brief!</p>
            </div>
          ) : (
            <div>
              {briefs.slice(0, 5).map((b) => (
                <div key={b._id} onClick={() => navigate(`/brief/${b._id}`)} className="data-row" style={{ cursor: "pointer" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--grey-800)" }}>{b.userName}'s Brief</div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-secondary)" }}>
                    {new Date(b.leaveStart).toLocaleDateString()} — {new Date(b.leaveEnd).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
