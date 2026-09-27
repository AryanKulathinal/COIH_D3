import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, RotateCcw, ArrowRight } from "lucide-react";
import { config, getAccount } from "../../data.js";
import { useSession } from "../../context/SessionContext.jsx";

function PersonaButton({ persona, active, dimmed, disabled, delay, onSelect }) {
  const account = getAccount(persona.account);
  const first = persona.name.split(" ")[0];
  return (
    <button className="glass glass-hover slide-item" disabled={disabled} onClick={() => onSelect(persona)}
      style={{
        textAlign: "left", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem",
        color: "var(--grey-900)", whiteSpace: "normal", cursor: disabled ? "default" : "pointer",
        borderTop: `3px solid ${account.color}`,
        transform: active ? "scale(1.02)" : undefined,
        borderColor: active ? account.color : undefined,
        boxShadow: active ? `0 0 0 1px ${account.color}, 0 16px 40px ${account.color}33` : undefined,
        opacity: dimmed ? 0.35 : 1,
        animationDelay: `${delay}s`,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: account.color, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.875rem", flexShrink: 0, boxShadow: `0 0 0 4px ${account.color}22, 0 8px 20px ${account.color}55` }}>
          {persona.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.938rem", lineHeight: 1.2, color: "var(--grey-900)" }}>{persona.name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>{persona.role}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        <span className="badge" style={{ background: `${account.color}1a`, color: account.color }}>{account.name} · {account.client}</span>
        <span className="badge badge-low">{persona.scenarioLabel}</span>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>{persona.pitch}</p>

      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: account.color, marginTop: "auto" }}>
        {active ? (
          <>
            <span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderBottomColor: account.color }} />
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
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.4rem", background: "linear-gradient(135deg, var(--bondi-blue), var(--primary-900))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,110,116,0.3)" }}>
            <Zap size={15} color="white" />
          </div>
          <span className="text-gradient" style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.04em" }}>COIH</span>
        </div>
        <span style={{ fontSize: "0.688rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>UST D3 Hackathon · Fix It Forward with Claude</span>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 1.5rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: "62rem" }}>
          <div className="slide-item" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.688rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--primary)" }}>Sign in</div>
            <h1 ref={headingRef} tabIndex={-1} className="text-gradient" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, margin: "0.5rem auto", outline: "none", display: "inline-block", paddingBottom: "0.1em" }}>
              Who are you today?
            </h1>
            <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
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

          <div className="slide-item" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.688rem", color: "var(--text-muted)", animationDelay: "0.4s" }}>
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
