import { useEffect } from "react";
import { Zap } from "lucide-react";

const LETTERS = "COIH".split("");
const DURATION_MS = 2500;

// Splash: wordmark reveal, pulse rings, subtitle, then dissolves. Any key or click skips it.
export default function Intro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, DURATION_MS);
    const onKey = () => onDone();
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onDone]);

  return (
    <div className="landing-content intro-out" onClick={onDone}
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", userSelect: "none" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="intro-ring" aria-hidden="true" style={{ position: "absolute", width: "16rem", height: "16rem", borderRadius: "50%", border: "1px solid rgba(0,110,116,0.55)" }} />
        <div className="intro-ring" aria-hidden="true" style={{ position: "absolute", width: "16rem", height: "16rem", borderRadius: "50%", border: "1px solid rgba(0,151,172,0.35)", animationDelay: "0.6s" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "1.125rem" }}>
          <div className="fade-up" style={{ width: "3.75rem", height: "3.75rem", borderRadius: "0.9rem", background: "linear-gradient(135deg, var(--bondi-blue), var(--primary-900))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,110,116,0.35)", animationDelay: "0.05s", flexShrink: 0 }}>
            <Zap size={30} color="white" />
          </div>
          <div aria-label="COIH" style={{ fontSize: "clamp(3rem, 9vw, 5.5rem)", fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1 }}>
            {LETTERS.map((letter, i) => (
              <span key={i} className="intro-letter text-gradient-v" aria-hidden="true" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>{letter}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="fade-up" style={{ marginTop: "1.75rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--primary-900)", textAlign: "center", padding: "0 1rem", animationDelay: "0.9s" }}>
        Central Operational Intelligence Hub
      </div>
      <div className="fade-up" style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", animationDelay: "1.3s" }}>
        The knowledge layer that builds itself
      </div>

      <div className="fade-up" style={{ position: "absolute", bottom: "1.5rem", fontSize: "0.625rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", animationDelay: "1.6s" }}>
        Press any key to skip
      </div>
    </div>
  );
}
