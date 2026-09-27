import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ChevronLeft, ChevronRight, ArrowRight, Clock, Brain, Link2, RefreshCw, ShieldCheck } from "lucide-react";
import { config, getAccount } from "../data.js";
import { useSession } from "../context/SessionContext.jsx";

const SLIDES = [
  {
    icon: Clock,
    kicker: "The problem",
    title: "3–5 hours to catch up after every leave",
    body: "Associates scroll back through mail, chat and tickets hoping nothing critical is buried on page six. Across a 5,000-person org that is 120,000–200,000 hours a year — and decisions made in threads they weren't copied on are simply missed.",
  },
  {
    icon: Brain,
    kicker: "The root cause",
    title: "Account knowledge is tacit",
    body: "It lives in individual heads and scattered threads, never in a system. So every catch-up, every new joiner, every “how do I fix this?” uses a colleague as the search engine — and when someone leaves, the knowledge leaves with them.",
  },
  {
    icon: Link2,
    kicker: "The hub",
    title: "Grounded in your account — or silent",
    body: "COIH connects to the tools the account already runs (mail, chat, Jira, incidents, docs, meetings). The AI answers only from those records, with a source on every line. When evidence is missing it refuses, names the gap and the person to ask.",
  },
  {
    icon: RefreshCw,
    kicker: "The difference",
    title: "A knowledge layer that builds itself",
    body: "Resolve an incident and the fix is captured automatically into a structured entry — symptom, root cause, steps, evidence — confirmed in one click. The next person asking gets an answer instead of an escalation. Every incident makes the next one cheaper.",
  },
];

function Slides() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearTimeout(timer.current);
  }, [index, paused]);

  const go = (delta) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];

  return (
    <div className="card" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{ padding: "1.5rem 1.75rem", position: "relative", minHeight: "12.5rem", display: "flex", gap: "1.25rem", alignItems: "center" }}>
      <button aria-label="Previous" className="btn-secondary" onClick={() => go(-1)} style={{ borderRadius: "50%", width: "2rem", height: "2rem", padding: 0, flexShrink: 0 }}>
        <ChevronLeft size={16} />
      </button>
      <div key={index} className="fade-in" style={{ flex: 1, display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "var(--radius-xl)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <slide.icon size={22} color="var(--primary)" />
        </div>
        <div>
          <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)" }}>
            {index + 1} / {SLIDES.length} · {slide.kicker}
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--grey-900)", margin: "0.25rem 0 0.5rem" }}>{slide.title}</h2>
          <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "46rem" }}>{slide.body}</p>
        </div>
      </div>
      <button aria-label="Next" className="btn-secondary" onClick={() => go(1)} style={{ borderRadius: "50%", width: "2rem", height: "2rem", padding: 0, flexShrink: 0 }}>
        <ChevronRight size={16} />
      </button>
      <div style={{ position: "absolute", bottom: "0.75rem", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "0.375rem" }}>
        {SLIDES.map((s, i) => (
          <button key={s.kicker} aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)}
            style={{ width: i === index ? "1.25rem" : "0.5rem", height: "0.5rem", borderRadius: "var(--radius-full)", padding: 0, background: i === index ? "var(--primary)" : "var(--grey-400)" }} />
        ))}
      </div>
    </div>
  );
}

function PersonaCard({ persona, onSelect }) {
  const account = getAccount(persona.account);
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: `3px solid ${account.color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: account.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.813rem" }}>
          {persona.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--grey-900)" }}>{persona.name}</div>
          <div style={{ fontSize: "0.688rem", color: "var(--text-secondary)" }}>{persona.role}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        <span className="badge" style={{ background: `${account.color}1a`, color: account.color }}>{account.name} · {account.client}</span>
        <span className="badge badge-low">{persona.scenarioLabel}</span>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{persona.pitch}</p>
      <div>
        <div style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Try this</div>
        <ol style={{ paddingLeft: "1rem", fontSize: "0.688rem", color: "var(--grey-700)", lineHeight: 1.7 }}>
          {persona.checklist.map((c) => <li key={c.id}>{c.label}</li>)}
        </ol>
      </div>
      <button className="btn-primary" onClick={() => onSelect(persona)} style={{ marginTop: "auto", background: account.color }}>
        Continue as {persona.name.split(" ")[0]} <ArrowRight size={13} />
      </button>
    </div>
  );
}

export default function Landing() {
  const { selectPersona } = useSession();
  const navigate = useNavigate();

  const onSelect = (persona) => {
    selectPersona(persona.id);
    navigate(persona.home);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div className="page-container fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-md)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary-900)" }}>COIH · Central Operational Intelligence Hub</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>The knowledge layer that builds itself — built with Claude Code for the UST D3 Hackathon</div>
          </div>
        </header>

        <Slides />

        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Pick who you are</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Three associates on two isolated accounts. Each persona has a short guided checklist — you can switch at any time from the top bar.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))", gap: "1rem" }}>
            {config.personas.map((p) => <PersonaCard key={p.id} persona={p} onSelect={onSelect} />)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.688rem", color: "var(--text-muted)" }}>
          <ShieldCheck size={13} />
          All data is synthetic. Integrations are mocked (see Connectors). Accounts are isolated — Alpha data is never visible to Beta, and vice versa.
        </div>
      </div>
    </div>
  );
}
