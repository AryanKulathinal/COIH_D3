import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, RotateCcw, ArrowRight } from "lucide-react";
import { config, getAccount } from "../../data.js";
import { useSession } from "../../context/SessionContext.jsx";

const ACCENT = "#7fd6dd";

function PersonaButton({ persona, active, dimmed, disabled, delay, onSelect }) {
  const account = getAccount(persona.account);
  const first = persona.name.split(" ")[0];
  return (
    <button className="glass glass-hover slide-item" disabled={disabled} onClick={() => onSelect(persona)}
      style={{
        textAlign: "left", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem",
        color: "#ffffff", whiteSpace: "normal", cursor: disabled ? "default" : "pointer",
        transform: active ? "scale(1.02)" : undefined,
        borderColor: active ? account.color : undefined,
        boxShadow: active ? `0 0 0 1px ${account.color}, 0 16px 40px ${account.color}55` : undefined,
        opacity: dimmed ? 0.35 : 1,
        animationDelay: `${delay}s`,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: account.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.875rem", flexShrink: 0, boxShadow: `0 0 0 4px ${account.color}33, 0 0 28px ${account.color}66` }}>
          {persona.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.938rem", lineHeight: 1.2 }}>{persona.name}</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginTop: "0.125rem" }}>{persona.role}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        <span className="badge" style={{ background: `${account.color}59`, color: "#ffffff" }}>{account.name} · {account.client}</span>
        <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}>{persona.scenarioLabel}</span>
      </div>

      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, flex: 1 }}>{persona.pitch}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: ACCENT, marginTop: "auto" }}>
        {active ? (
          <>
            <span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderColor: "rgba(255,255,255,0.25)", borderBottomColor: "#ffffff" }} />
            Signing in as {first}…
          </>
        ) : (
          <>Continue as {first} <ArrowRight size={13} /></>
        )}
      </div>
    </button>
  );
}

// Sign-in stage: three one-click personas. Selecting one shows a short "signing in" state, then
// sets the persona (which flips the App gate to the Shell) and navigates to that persona's home.
export default function Login({ onReplay, reduced }) {
  const { selectPersona } = useSession();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    if (!signingIn) return;
    const t = setTimeout(() => {
      selectPersona(signingIn.id);
      navigate(signingIn.home);
    }, reduced ? 400 : 1100);
    return () => clearTimeout(t);
  }, [signingIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="landing-content" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.4rem", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(0,151,172,0.5)" }}>
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.04em" }}>COIH</span>
        </div>
        <span style={{ fontSize: "0.688rem", color: "rgba(255,255,255,0.45)" }}>UST D3 Hackathon · Fix It Forward with Claude</span>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 1.5rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: "62rem" }}>
          <div className="slide-item" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.688rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT }}>Sign in</div>
            <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, margin: "0.5rem 0 0.5rem", outline: "none" }}>
              Who are you today?
            </h1>
            <p style={{ fontSize: "0.813rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              Three associates on two isolated accounts. Alpha data is never visible to Beta, and vice versa.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "1rem" }}>
            {config.personas.map((p, i) => (
              <PersonaButton key={p.id} persona={p} delay={0.1 + i * 0.08}
                active={signingIn?.id === p.id}
                dimmed={Boolean(signingIn) && signingIn.id !== p.id}
                disabled={Boolean(signingIn)}
                onSelect={setSigningIn} />
            ))}
          </div>

          <div className="slide-item" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.688rem", color: "rgba(255,255,255,0.45)", animationDelay: "0.4s" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <ShieldCheck size={13} /> All data is synthetic. Integrations are mocked (see Connectors). Switch persona any time from the top bar.
            </span>
            <button className="btn-glass btn-sm" onClick={onReplay} disabled={Boolean(signingIn)}>
              <RotateCcw size={12} /> Replay the story
            </button>
          </div>
        </div>
      </main>

      <div className="sr-only" role="status" aria-live="polite">{signingIn ? `Signing in as ${signingIn.name}` : ""}</div>
    </div>
  );
}
