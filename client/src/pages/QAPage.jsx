import { useState } from "react";
import { Send, ExternalLink, AlertCircle, CheckCircle, HelpCircle, ShieldAlert } from "lucide-react";
import { api } from "../services/api.js";

const EXAMPLE_QUESTIONS = [
  "What decisions were made about the payment gateway?",
  "Were there any production incidents?",
  "What's the status of API rate limiting?",
  "Who handled the security CVE patch?",
  "What do I need for the Q2 SLA review?",
  "What is the inventory service deployment process?",
];

export default function QAPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(question) {
    const q = question || input.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const result = await api.askQuestion({ question: q });
      setMessages((prev) => [...prev, { role: "assistant", data: result }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "error", text: e.message }]);
    } finally { setLoading(false); }
  }

  const confCfg = {
    high: { icon: CheckCircle, color: "var(--success)", label: "High confidence" },
    medium: { icon: HelpCircle, color: "var(--warning-dark)", label: "Medium confidence" },
    low: { icon: AlertCircle, color: "var(--warning-dark)", label: "Low confidence" },
    none: { icon: ShieldAlert, color: "var(--error)", label: "Insufficient evidence" },
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 5.5rem)" }}>
      <div style={{ marginBottom: "0.625rem" }}>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.125rem" }}>Grounded Q&A</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Ask operational questions — every answer is grounded in sources with calibrated confidence</p>
      </div>

      <div style={{ flex: 1, overflow: "auto", marginBottom: "0.625rem" }}>
        {messages.length === 0 && (
          <div style={{ padding: "1rem 0" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.688rem", marginBottom: "0.5rem" }}>Try asking:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} className="btn-secondary" onClick={() => handleAsk(q)} style={{ fontSize: "0.688rem", padding: "0.25rem 0.625rem" }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "0.625rem" }} className="fade-in">
            {msg.role === "user" && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "var(--primary)", color: "#fff", padding: "0.5rem 0.75rem", borderRadius: "0.625rem 0.625rem 0.188rem 0.625rem", maxWidth: "65%", fontSize: "0.75rem" }}>
                  {msg.text}
                </div>
              </div>
            )}

            {msg.role === "assistant" && (
              <div style={{ maxWidth: "75%" }}>
                <div className="card" style={{ padding: "0.75rem" }}>
                  {msg.data.confidence && (() => {
                    const c = confCfg[msg.data.confidence] || confCfg.medium;
                    const Icon = c.icon;
                    return (<div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}>
                      <Icon size={12} color={c.color} /><span style={{ fontSize: "0.625rem", color: c.color, fontWeight: 500 }}>{c.label}</span>
                    </div>);
                  })()}

                  {msg.data.answer ? (
                    <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "var(--grey-900)" }}>{msg.data.answer}</p>
                  ) : (
                    <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--error-light)", border: "1px solid var(--error)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.313rem", marginBottom: "0.25rem" }}>
                        <ShieldAlert size={13} color="var(--error)" />
                        <span style={{ fontSize: "0.688rem", fontWeight: 600, color: "var(--error-dark)" }}>Calibrated Refusal</span>
                      </div>
                      <p style={{ fontSize: "0.688rem", color: "var(--error-dark)" }}>{msg.data.refusal}</p>
                      {msg.data.suggestedSources?.length > 0 && (
                        <div style={{ marginTop: "0.375rem" }}>
                          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Try: </span>
                          {msg.data.suggestedSources.map((s, j) => (
                            <span key={j} style={{ fontSize: "0.625rem", color: "var(--primary)" }}>{s}{j < msg.data.suggestedSources.length - 1 ? ", " : ""}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.data.sources?.length > 0 && (
                    <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.563rem", color: "var(--text-muted)", marginBottom: "0.313rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sources</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.188rem" }}>
                        {msg.data.sources.map((src, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "start", gap: "0.313rem", fontSize: "0.688rem" }}>
                            <ExternalLink size={10} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <span style={{ color: "var(--primary)", fontWeight: 500 }}>[{src.sourceId}]</span>
                              {src.title && <span style={{ color: "var(--text-secondary)" }}> — {src.title}</span>}
                              {src.snippet && <p style={{ color: "var(--text-muted)", fontSize: "0.625rem", marginTop: "0.063rem", fontStyle: "italic" }}>"{src.snippet}"</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.data.gaps?.length > 0 && (
                    <div style={{ marginTop: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)" }}><strong>Gaps:</strong> {msg.data.gaps.join("; ")}</div>
                  )}

                  {msg.data.tokenUsage && (
                    <div style={{ marginTop: "0.375rem", fontSize: "0.563rem", color: "var(--text-muted)" }}>
                      {(msg.data.tokenUsage.inputTokens + msg.data.tokenUsage.outputTokens).toLocaleString()} tokens | ${msg.data.tokenUsage.estimatedCost?.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.role === "error" && (
              <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--error-light)", color: "var(--error-dark)", fontSize: "0.75rem", border: "1px solid var(--error)" }}>
                Error: {msg.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-muted)" }}>
            <div className="spinner" /><span style={{ fontSize: "0.75rem" }}>Searching sources...</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.375rem" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
          placeholder="Ask about what happened during your leave..." disabled={loading} style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => handleAsk()} disabled={loading || !input.trim()} style={{ padding: "0.375rem 0.625rem" }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
