import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, SkipForward, Zap } from "lucide-react";
import { SLIDES } from "./slides.js";

const INTERVAL_MS = 7000;
const ACCENT = "#7fd6dd";

function Tile({ tile, delay }) {
  return (
    <div className="glass slide-item" style={{ padding: "0.875rem 1rem", animationDelay: `${delay}s` }}>
      {tile.stat ? (
        <div style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.625rem)", fontWeight: 600, color: ACCENT, lineHeight: 1.1 }}>{tile.stat}</div>
      ) : (
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>{tile.title}</div>
      )}
      <div style={{ fontSize: "0.688rem", color: "rgba(255,255,255,0.65)", marginTop: "0.25rem", lineHeight: 1.5 }}>{tile.label}</div>
      {tile.sub && <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginTop: "0.125rem" }}>{tile.sub}</div>}
    </div>
  );
}

// Full-viewport deck. Autoplay is driven by the progress bar's CSS animation (onAnimationEnd),
// so the bar and the advance can never drift apart, and pausing the animation pauses both.
export default function SlideDeck({ onFinish, reduced }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const rootRef = useRef(null);

  const total = SLIDES.length;
  const last = index === total - 1;
  const autoplay = !reduced && !last;
  const paused = hover || focusWithin || hidden;
  const slide = SLIDES[index];

  const goTo = (i) => {
    const target = Math.min(Math.max(i, 0), total - 1);
    setDir(target >= index ? 1 : -1);
    setIndex(target);
  };
  const next = () => (last ? onFinish() : goTo(index + 1));
  const prev = () => goTo(index - 1);

  useEffect(() => { rootRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      // A focused button already fires click on Enter/Space; do not double-advance.
      if ((e.key === "Enter" || e.key === " ") && e.target.tagName === "BUTTON") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, last, onFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  const onBlur = (e) => {
    const stillInside = Boolean(e.relatedTarget) && e.relatedTarget !== e.currentTarget && e.currentTarget.contains(e.relatedTarget);
    setFocusWithin(stillInside);
  };

  return (
    <div ref={rootRef} tabIndex={-1} className="landing-content"
      onFocus={(e) => { if (e.target !== e.currentTarget) setFocusWithin(true); }}
      onBlur={onBlur}
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", outline: "none" }}>

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.4rem", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(0,151,172,0.5)", flexShrink: 0 }}>
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.04em" }}>COIH</span>
          <span style={{ fontSize: "0.688rem", color: "rgba(255,255,255,0.45)", marginLeft: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            UST D3 Hackathon · Fix It Forward with Claude
          </span>
        </div>
        <button className="btn-glass" onClick={onFinish}>
          Skip to sign in <SkipForward size={13} />
        </button>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "68rem", display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", gap: "1rem", alignItems: "center" }}>
          <button aria-label="Previous slide" className="btn-glass" onClick={prev} disabled={index === 0}
            style={{ width: "2.5rem", height: "2.5rem", padding: 0, borderRadius: "50%" }}>
            <ChevronLeft size={18} />
          </button>

          <article key={index} className="slide-enter" style={{ "--dx": dir > 0 ? "1.5rem" : "-1.5rem", padding: "0.5rem 0.75rem" }}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="slide-item" style={{ display: "flex", alignItems: "center", gap: "0.625rem", animationDelay: "0s" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.6rem", background: "rgba(0,151,172,0.18)", border: "1px solid rgba(0,151,172,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <slide.icon size={18} color={ACCENT} />
              </div>
              <div style={{ fontSize: "0.688rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT }}>
                {slide.kicker}
                <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "0.625rem", fontWeight: 500 }}>{index + 1} / {total}</span>
              </div>
            </div>

            <h1 className="slide-item" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em", margin: "1rem 0 0.875rem", maxWidth: "44rem", animationDelay: "0.08s" }}>
              {slide.title}
            </h1>
            <p className="slide-item" style={{ fontSize: "clamp(0.875rem, 1.3vw, 1rem)", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, maxWidth: "46rem", animationDelay: "0.16s" }}>
              {slide.body}
            </p>

            {slide.tiles && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "0.75rem", marginTop: "1.5rem", maxWidth: "52rem" }}>
                {slide.tiles.map((tile, i) => <Tile key={tile.stat || tile.title} tile={tile} delay={0.24 + i * 0.06} />)}
              </div>
            )}

            {last && (
              <div className="slide-item" style={{ marginTop: "1.75rem", animationDelay: "0.5s" }}>
                <button className="btn-light" onClick={onFinish}>
                  Sign in <ArrowRight size={14} />
                </button>
              </div>
            )}
          </article>

          <button aria-label={last ? "Sign in" : "Next slide"} className="btn-glass" onClick={next}
            style={{ width: "2.5rem", height: "2.5rem", padding: 0, borderRadius: "50%" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </main>

      <footer style={{ padding: "0 1.5rem 1.25rem", maxWidth: "68rem", width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
          {SLIDES.map((s, i) => (
            <button key={s.id} aria-label={`Go to slide ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => goTo(i)}
              style={{ flex: 1, height: "1rem", display: "flex", alignItems: "center", background: "none", padding: 0 }}>
              <span className={`seg ${i < index ? "seg-done" : ""}`}>
                {i === index && (autoplay ? (
                  <span key={index} className="seg-fill"
                    style={{ animationDuration: `${INTERVAL_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                    onAnimationEnd={() => goTo(index + 1)} />
                ) : (
                  <span className="seg-fill" style={{ animation: "none", transform: "scaleX(1)" }} />
                ))}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
          <span>{"← → to navigate · Esc to skip"}{autoplay && paused ? " · paused" : ""}</span>
          <span>All data is synthetic</span>
        </div>
      </footer>

      <div className="sr-only" role="status" aria-live="polite">Slide {index + 1} of {total}: {slide.title}</div>
    </div>
  );
}
