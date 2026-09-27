import { useState } from "react";
import { Plane, ChevronDown, ChevronRight, CheckCircle2, Loader, CalendarClock, RefreshCw } from "lucide-react";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { SourceChip } from "../components/SourceDrawer.jsx";
import RunMeta from "../components/RunMeta.jsx";

const SECTION_CONFIG = {
  decisions: { label: "Decisions made in your area", color: "var(--primary)" },
  workItems: { label: "Work assigned, reassigned or escalated to you", color: "var(--primary-450)" },
  openQuestions: { label: "Threads still waiting on your reply", color: "var(--warning-dark)" },
  incidents: { label: "Incidents in your components", color: "var(--error)" },
  blockedItems: { label: "Blocked on your input (oldest first)", color: "var(--error-dark)" },
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function Progress({ events }) {
  return (
    <div className="card fade-in" style={{ maxWidth: "34rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <span className="spinner" />
        <span style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)" }}>The hub is reconstructing what changed…</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {events.map((e, i) => (
          <div key={i} className="fade-in" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.688rem", color: "var(--grey-700)" }}>
            <CheckCircle2 size={12} color="var(--success)" />
            {e.label}
            {e.type === "tool" && <code style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{e.name}()</code>}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.688rem", color: "var(--text-muted)" }}>
          <Loader size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Synthesising the brief
        </div>
      </div>
    </div>
  );
}

function Section({ sectionKey, section }) {
  const [open, setOpen] = useState(true);
  const config = SECTION_CONFIG[sectionKey];
  if (!section?.items?.length) return null;
  return (
    <div className="card" style={{ marginBottom: "0.5rem" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", marginBottom: open ? "0.625rem" : 0 }}>
        {open ? <ChevronDown size={14} color="var(--grey-600)" /> : <ChevronRight size={14} color="var(--grey-600)" />}
        <div style={{ width: 3, height: 14, borderRadius: 2, background: config.color }} />
        <h3 style={{ fontSize: "0.75rem", fontWeight: 600, flex: 1, color: "var(--grey-900)" }}>{config.label}</h3>
        <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{section.items.length}</span>
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {section.items.map((item, i) => (
            <div key={i} style={{ padding: "0.625rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", background: "var(--grey-100)" }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "0.75rem", marginBottom: "0.188rem", color: "var(--grey-900)" }}>{item.summary}</div>
                  {item.detail && <p style={{ fontSize: "0.688rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.detail}</p>}
                  {(item.whereDecided || item.date) && (
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                      {[item.date && fmtDate(item.date), item.whereDecided].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                  {item.priority && <span className={`badge badge-${item.priority}`}>{item.priority}</span>}
                  {item.status && <span className={`badge badge-${item.status}`}>{item.status.replace("_", " ")}</span>}
                </div>
              </div>
              {item.sources?.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {item.sources.map((src, j) => <SourceChip key={j} id={src.sourceId} label={src.title} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BriefPage() {
  const { persona, account, accountId, markStep, getCached, setCached } = useSession();
  const [result, setResult] = useState(() => getCached("brief"));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const final = await api.streamBrief({ accountId, personaId: persona.id }, (e) => {
        if (e.type === "tool" || e.type === "start") setEvents((prev) => [...prev, e]);
      });
      setResult(final);
      setCached("brief", final);
      markStep("brief");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const first = persona.name.split(" ")[0];

  if (loading) return <Progress events={events} />;

  if (!result) {
    return (
      <div className="fade-in">
        <h1 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--grey-900)" }}>Return-from-Leave Brief</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "1.25rem" }}>Not an inbox summary — the state change in your scope while you were away, every line linked to its source.</p>
        <div className="card" style={{ maxWidth: "28rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <Plane size={18} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.813rem", color: "var(--grey-900)" }}>{persona.name} · {account.team}</div>
              <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Away {fmtDate(persona.leave.start)} – {fmtDate(persona.leave.end)} 2025 · back today ({fmtDate(persona.today)})</div>
            </div>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            The brief agent will query every connected source for the absence window — emails, chats, Jira, incidents, documents, meeting transcripts and the calendar — and reconstruct decisions, reassignments, unanswered threads, incidents and blockers.
          </p>
          {error && <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--error-light)", color: "var(--error-dark)", marginBottom: "0.75rem", fontSize: "0.75rem" }}>{error}</div>}
          <button className="btn-primary" onClick={generate} style={{ width: "100%" }}>
            <Plane size={13} /> Generate my brief
          </button>
        </div>
      </div>
    );
  }

  const { brief } = result;
  const stats = brief.stats || {};
  const tiles = [
    { label: "Decisions", value: stats.decisions ?? stats.keyDecisions, color: "var(--primary)" },
    { label: "Need your action", value: stats.actionItems, color: "var(--error)" },
    { label: "Emails", value: stats.emails ?? stats.totalEmails, color: "var(--primary-450)" },
    { label: "Chats", value: stats.chats ?? stats.totalChats, color: "var(--bondi-blue)" },
    { label: "Tickets", value: stats.tickets ?? stats.totalTickets, color: "var(--warning-dark)" },
    { label: "Meetings", value: stats.meetings ?? stats.totalMeetings, color: "var(--purple)" },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Welcome back, {first}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
            What changed while you were away ({fmtDate(persona.leave.start)} – {fmtDate(persona.leave.end)})
          </p>
          <RunMeta result={result} manualHours="3–5" />
        </div>
        <button className="btn-secondary btn-sm" onClick={generate}><RefreshCw size={12} /> Regenerate</button>
      </div>

      {brief.overview && (
        <div className="card" style={{ marginBottom: "0.75rem", borderLeft: "3px solid var(--primary)" }}>
          <div style={{ fontSize: "0.563rem", fontWeight: 600, color: "var(--primary)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overview</div>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{brief.overview}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {tiles.map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "0.625rem 0.5rem" }}>
            <div style={{ fontSize: "1.125rem", fontWeight: 600, color: s.color, lineHeight: 1.2 }}>{s.value ?? 0}</div>
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {Object.keys(SECTION_CONFIG).map((key) => <Section key={key} sectionKey={key} section={brief.sections?.[key]} />)}

      {brief.upcoming?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <CalendarClock size={14} color="var(--primary)" /> Coming up
          </h3>
          {brief.upcoming.map((u, i) => (
            <div key={i} className="data-row" style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.688rem" }}>
              <span style={{ width: "3.5rem", color: "var(--text-muted)" }}>{u.when && fmtDate(u.when)}</span>
              <span style={{ flex: 1 }}><strong style={{ fontWeight: 500 }}>{u.title}</strong>{u.prep && <span style={{ color: "var(--text-secondary)" }}> — {u.prep}</span>}</span>
              {u.sourceId && <SourceChip id={u.sourceId} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
