import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, ExternalLink } from "lucide-react";
import { api } from "../services/api.js";

const CATEGORY_COLORS = {
  decision: { bg: "var(--primary-light)", color: "var(--primary)" },
  incident: { bg: "var(--error-light)", color: "var(--error-dark)" },
  task: { bg: "var(--warning-light)", color: "var(--warning-dark)" },
  update: { bg: "var(--success-light)", color: "var(--success)" },
  meeting: { bg: "var(--purple-light)", color: "var(--purple)" },
};

export default function Flashcards({ leaveStart, leaveEnd }) {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadCards() {
    setLoading(true);
    try {
      const data = await api.getFlashcards({ leaveStart, leaveEnd });
      setCards(data.flashcards || []);
      setCurrent(0);
      setFlipped(false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCards(); }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "2rem 0", color: "var(--text-muted)" }}><div className="spinner" /> Generating flashcards...</div>;
  if (!cards.length) return <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "2rem 0" }}>No flashcards available. <button className="btn-primary btn-sm" onClick={loadCards}>Generate</button></div>;

  const card = cards[current];
  const catStyle = CATEGORY_COLORS[card.category] || CATEGORY_COLORS.update;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Card {current + 1} of {cards.length}</div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <div style={{ width: "100%", maxWidth: "12rem", height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
            <div style={{ width: `${((current + 1) / cards.length) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      <div onClick={() => setFlipped(!flipped)} style={{
        cursor: "pointer", perspective: "1000px", marginBottom: "0.75rem",
      }}>
        <div style={{
          minHeight: "11rem", borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)", background: "var(--bg-card)",
          boxShadow: "var(--shadow-md)", padding: "1.25rem",
          display: "flex", flexDirection: "column", justifyContent: "center",
          transition: "box-shadow 0.2s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.75rem" }}>
            <span style={{ padding: "0.125rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.625rem", fontWeight: 500, background: catStyle.bg, color: catStyle.color, textTransform: "capitalize" }}>
              {card.category}
            </span>
            <span className={`badge badge-${card.priority}`}>{card.priority}</span>
            {card.sourceId && (
              <span style={{ fontSize: "0.625rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.125rem", marginLeft: "auto" }}>
                <ExternalLink size={9} />{card.sourceId}
              </span>
            )}
          </div>

          {!flipped ? (
            <div>
              <div style={{ fontSize: "0.563rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Question</div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--grey-900)", lineHeight: 1.5 }}>{card.front}</p>
            </div>
          ) : (
            <div className="fade-in">
              <div style={{ fontSize: "0.563rem", fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Answer</div>
              <p style={{ fontSize: "0.813rem", color: "var(--grey-800)", lineHeight: 1.6 }}>{card.back}</p>
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: "0.75rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{flipped ? "Click to see question" : "Click to reveal answer"}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        <button className="btn-secondary btn-sm" onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setFlipped(false); }} disabled={current === 0}>
          <ChevronLeft size={14} /> Prev
        </button>
        <button className="btn-secondary btn-sm" onClick={() => { setCurrent(0); setFlipped(false); }}>
          <RotateCcw size={12} /> Reset
        </button>
        <button className="btn-primary btn-sm" onClick={() => { setCurrent((c) => Math.min(cards.length - 1, c + 1)); setFlipped(false); }} disabled={current === cards.length - 1}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
