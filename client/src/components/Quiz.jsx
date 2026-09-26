import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink, Trophy, RotateCcw } from "lucide-react";
import { api } from "../services/api.js";

export default function Quiz({ leaveStart, leaveEnd }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadQuiz() {
    setLoading(true);
    try {
      const data = await api.getQuiz({ leaveStart, leaveEnd });
      setQuestions(data.questions || []);
      setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setCompleted(false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadQuiz(); }, []);

  function handleSelect(idx) {
    if (revealed) return;
    setSelected(idx);
  }

  function handleReveal() {
    if (selected === null) return;
    setRevealed(true);
    if (selected === questions[current].correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setCompleted(true);
    }
  }

  const DIFF_COLORS = { easy: "var(--success)", medium: "var(--warning-dark)", hard: "var(--error)" };

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "2rem 0", color: "var(--text-muted)" }}><div className="spinner" /> Generating quiz...</div>;
  if (!questions.length) return <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "2rem 0" }}>No quiz available. <button className="btn-primary btn-sm" onClick={loadQuiz}>Generate</button></div>;

  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card fade-in" style={{ maxWidth: "24rem", margin: "0 auto", textAlign: "center", padding: "2rem" }}>
        <Trophy size={36} color={pct >= 70 ? "var(--success)" : "var(--warning-dark)"} style={{ margin: "0 auto 0.75rem" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.25rem" }}>Quiz Complete!</h2>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: pct >= 70 ? "var(--success)" : "var(--warning-dark)", marginBottom: "0.25rem" }}>{pct}%</div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{score} of {questions.length} correct</p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
          {pct >= 90 ? "Excellent! You're fully caught up." : pct >= 70 ? "Good job! Review the items you missed." : "You might want to review the brief more carefully."}
        </p>
        <button className="btn-primary" onClick={loadQuiz}><RotateCcw size={13} /> Retake Quiz</button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Question {current + 1} of {questions.length}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.688rem", color: "var(--success)", fontWeight: 500 }}>Score: {score}/{current + (revealed ? 1 : 0)}</span>
          <div style={{ width: "8rem", height: 4, borderRadius: 2, background: "var(--border-light)" }}>
            <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.625rem" }}>
          <span style={{ fontSize: "0.625rem", fontWeight: 500, color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
          {q.sourceId && <span style={{ fontSize: "0.625rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.125rem", marginLeft: "auto" }}><ExternalLink size={9} />{q.sourceId}</span>}
        </div>

        <p style={{ fontSize: "0.813rem", fontWeight: 500, color: "var(--grey-900)", marginBottom: "0.75rem", lineHeight: 1.5 }}>{q.question}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {q.options.map((opt, i) => {
            let bg = "var(--bg-card)";
            let border = "1px solid var(--border)";
            let color = "var(--grey-800)";

            if (revealed) {
              if (i === q.correctIndex) { bg = "var(--success-light)"; border = "1px solid var(--success)"; color = "var(--success)"; }
              else if (i === selected) { bg = "var(--error-light)"; border = "1px solid var(--error)"; color = "var(--error-dark)"; }
            } else if (i === selected) {
              bg = "var(--primary-light)"; border = "1px solid var(--primary)"; color = "var(--primary)";
            }

            return (
              <div key={i} onClick={() => handleSelect(i)} style={{
                padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)",
                background: bg, border, color, cursor: revealed ? "default" : "pointer",
                fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem",
                transition: "all 0.15s",
              }}>
                <span style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", border: `2px solid ${revealed && i === q.correctIndex ? "var(--success)" : revealed && i === selected ? "var(--error)" : i === selected ? "var(--primary)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.625rem", fontWeight: 600 }}>
                  {revealed && i === q.correctIndex && <CheckCircle size={14} color="var(--success)" />}
                  {revealed && i === selected && i !== q.correctIndex && <XCircle size={14} color="var(--error)" />}
                  {!revealed && String.fromCharCode(65 + i)}
                </span>
                {opt}
              </div>
            );
          })}
        </div>

        {revealed && (
          <div className="fade-in" style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--primary-light)", fontSize: "0.75rem", color: "var(--grey-800)", lineHeight: 1.5 }}>
            <strong>Explanation:</strong> {q.explanation}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.375rem" }}>
        {!revealed ? (
          <button className="btn-primary" onClick={handleReveal} disabled={selected === null}>Check Answer</button>
        ) : (
          <button className="btn-primary" onClick={handleNext}>{current < questions.length - 1 ? "Next Question" : "See Results"}</button>
        )}
      </div>
    </div>
  );
}
