import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Columns2, MessagesSquare, Database, BookOpen } from "lucide-react";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import AnswerCard from "../components/AnswerCard.jsx";

// Maps what the judge just did to the persona's guided-demo checklist.
function stepsFor(persona, question, result, incidentState, compare) {
  const steps = [];
  const refused = !result.answer || result.confidence === "none";
  if (compare) steps.push("compare");
  steps.push(refused ? "ask-refusal" : "ask-grounded");
  if (persona.id === "meera") {
    if (/4421|orders-db/i.test(question)) steps.push("isolation");
    if (/429|fastship|carrier/i.test(question)) steps.push(incidentState["INC-7310"]?.status === "resolved" ? "ask-after" : "ask-before");
  }
  return steps;
}

function Thinking({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>
      <div className="spinner" /><span style={{ fontSize: "0.75rem" }}>{label}</span>
    </div>
  );
}

function CompareColumn({ title, subtitle, icon: Icon, color, state }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", background: "var(--white)", border: `1px solid ${color}` }}>
        <Icon size={14} color={color} />
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color }}>{title}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{subtitle}</div>
        </div>
      </div>
      {state?.loading && <Thinking label="Searching…" />}
      {state?.error && <div className="card" style={{ color: "var(--error-dark)", fontSize: "0.75rem" }}>{state.error}</div>}
      {state?.data && <AnswerCard data={state.data} />}
    </div>
  );
}

export default function QAPage() {
  const { persona, accountId, captured, incidentState, markStep } = useSession();
  const [params, setParams] = useSearchParams();
  const compare = params.get("compare") === "1";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pair, setPair] = useState(null);

  const base = () => ({ accountId, personaId: persona.id, capturedEntries: captured });
  const record = (q, result) => stepsFor(persona, q, result, incidentState, compare).forEach(markStep);

  async function askChat(q) {
    const history = messages.flatMap((m) => (m.role === "user" ? [{ role: "user", content: m.text }] : m.data ? [{ role: "assistant", content: m.data.answer || m.data.refusal || "" }] : []));
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const data = await api.ask({ ...base(), question: q, history, kbMode: "connected" });
      setMessages((prev) => [...prev, { role: "assistant", data }]);
      record(q, data);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "error", text: e.message }]);
    } finally {
      setLoading(false);
    }
  }

  async function askCompare(q) {
    setPair({ question: q, raw: { loading: true }, hub: { loading: true } });
    const run = async (kbMode, key) => {
      try {
        const data = await api.ask({ ...base(), question: q, kbMode });
        setPair((p) => ({ ...p, [key]: { data } }));
        return data;
      } catch (e) {
        setPair((p) => ({ ...p, [key]: { error: e.message } }));
      }
    };
    const [, hub] = await Promise.all([run("disconnected", "raw"), run("connected", "hub")]);
    if (hub) record(q, hub);
  }

  function submit(question) {
    const q = (question || input).trim();
    if (!q || loading || pair?.raw?.loading || pair?.hub?.loading) return;
    setInput("");
    compare ? askCompare(q) : askChat(q);
  }

  const busy = loading || pair?.raw?.loading || pair?.hub?.loading;
  const setMode = (c) => setParams(c ? { compare: "1" } : {});

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)" }}>Ask the hub</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Answers come only from this account's records, with a source on every claim — or a refusal that names the gap.</p>
        </div>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", padding: "0.125rem", background: "var(--white)" }}>
          {[{ c: false, label: "Chat", icon: MessagesSquare }, { c: true, label: "Compare: raw vs knowledge layer", icon: Columns2 }].map((m) => (
            <button key={m.label} onClick={() => setMode(m.c)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.688rem", background: compare === m.c ? "var(--primary)" : "transparent", color: compare === m.c ? "white" : "var(--grey-700)" }}>
              <m.icon size={12} /> {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {persona.questions.map((q) => (
          <button key={q} className="btn-secondary" disabled={busy} onClick={() => submit(q)} style={{ fontSize: "0.688rem", padding: "0.25rem 0.625rem" }}>{q}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.375rem" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={compare ? "Ask one question — see both answers side by side" : "Ask an operational question…"} disabled={busy} maxLength={1000} style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => submit()} disabled={busy || !input.trim()} style={{ padding: "0.375rem 0.75rem" }}><Send size={14} /></button>
      </div>

      {compare ? (
        <>
          {!pair && (
            <div className="card" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The same question runs twice. <strong>Left:</strong> raw records only — what enterprise search gives you. <strong>Right:</strong> the hub with its self-built knowledge layer, captured from resolved incidents and answered questions.
            </div>
          )}
          {pair && (
            <>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--grey-900)" }}>“{pair.question}”</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "start" }}>
                <CompareColumn title="Raw sources only" subtitle="Knowledge layer disconnected (plain enterprise search)" icon={Database} color="var(--grey-600)" state={pair.raw} />
                <CompareColumn title="COIH knowledge layer" subtitle="Raw sources + captured, confirmed knowledge" icon={BookOpen} color="var(--primary)" state={pair.hub} />
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {messages.map((m, i) => (
            <div key={i}>
              {m.role === "user" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--primary)", color: "#fff", padding: "0.5rem 0.75rem", borderRadius: "0.625rem 0.625rem 0.188rem 0.625rem", maxWidth: "65%", fontSize: "0.75rem" }}>{m.text}</div>
                </div>
              )}
              {m.role === "assistant" && <div style={{ maxWidth: "80%" }}><AnswerCard data={m.data} /></div>}
              {m.role === "error" && <div className="card" style={{ color: "var(--error-dark)", fontSize: "0.75rem" }}>{m.text}</div>}
            </div>
          ))}
          {loading && <Thinking label="Searching this account's sources and knowledge…" />}
        </div>
      )}
    </div>
  );
}
