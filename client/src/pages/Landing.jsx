import { useCallback, useEffect, useState } from "react";
import Intro from "./landing/Intro.jsx";
import SlideDeck from "./landing/SlideDeck.jsx";
import Login from "./landing/Login.jsx";

// sessionStorage (not localStorage) so Reset demo, which clears coih:* in localStorage, leaves it alone.
const SEEN_KEY = "coih:introSeen";
const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MQ);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Soft colour washes over the light page background (theme teals plus the Beta purple, kept faint).
const ORBS = [
  { color: "#80b7b9", top: "-12%", left: "-10%", duration: "24s", delay: "0s", opacity: 0.45 },
  { color: "#0097ac", bottom: "-18%", right: "-8%", duration: "30s", delay: "-9s", opacity: 0.18 },
  { color: "#e7d2e7", top: "35%", left: "58%", duration: "19s", delay: "-4s", opacity: 0.6 },
];

// Landing stages: intro (splash) → slides (problem / root cause deck) → login (persona pick).
// A repeat visit in the same tab goes straight to login; "Back to intro" in the app calls
// requestIntroReplay() first so the full intro plays again.
export function requestIntroReplay() {
  sessionStorage.removeItem(SEEN_KEY);
}

export default function Landing() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return "login";
    return reduced ? "slides" : "intro";
  });

  const toSlides = useCallback(() => setStage("slides"), []);
  const toLogin = useCallback(() => { sessionStorage.setItem(SEEN_KEY, "1"); setStage("login"); }, []);

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        {ORBS.map((o, i) => (
          <div key={i} className="orb" style={{
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            top: o.top, left: o.left, right: o.right, bottom: o.bottom,
            animationDuration: o.duration, animationDelay: o.delay, opacity: o.opacity,
          }} />
        ))}
      </div>

      <div key={stage} className="stage-enter" style={{ position: "relative", zIndex: 1 }}>
        {stage === "intro" && <Intro onDone={toSlides} />}
        {stage === "slides" && <SlideDeck onFinish={toLogin} reduced={reduced} />}
        {stage === "login" && <Login onReplay={toSlides} reduced={reduced} />}
      </div>
    </div>
  );
}
