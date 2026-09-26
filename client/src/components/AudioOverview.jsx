import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { api } from "../services/api.js";

export default function AudioOverview({ leaveStart, leaveEnd }) {
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [muted, setMuted] = useState(false);
  const utteranceRef = useRef(null);

  async function loadScript() {
    setLoading(true);
    try {
      const data = await api.getAudioScript({ leaveStart, leaveEnd });
      setScript(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadScript(); }, []);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  function speak(segIndex) {
    if (!script?.segments?.[segIndex]) return;
    window.speechSynthesis.cancel();

    const seg = script.segments[segIndex];
    const utter = new SpeechSynthesisUtterance(seg.text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = muted ? 0 : 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female")) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;

    utter.onend = () => {
      if (segIndex < script.segments.length - 1) {
        setCurrentSegment(segIndex + 1);
        speak(segIndex + 1);
      } else {
        setPlaying(false);
      }
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
    setCurrentSegment(segIndex);
  }

  function togglePlay() {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      speak(currentSegment);
    }
  }

  function skipTo(idx) {
    window.speechSynthesis.cancel();
    setCurrentSegment(idx);
    if (playing) speak(idx);
  }

  const TYPE_COLORS = {
    intro: "var(--primary)", summary: "var(--bondi-blue)", decisions: "var(--purple)",
    incidents: "var(--error)", action_items: "var(--warning-dark)", closing: "var(--success)",
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "2rem 0", color: "var(--text-muted)" }}><div className="spinner" /> Generating audio briefing...</div>;
  if (!script) return <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "2rem 0" }}>No audio script available. <button className="btn-primary btn-sm" onClick={loadScript}>Generate</button></div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: "0.75rem", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <button className="btn-secondary btn-sm" onClick={() => skipTo(Math.max(0, currentSegment - 1))} disabled={currentSegment === 0}>
            <SkipBack size={14} />
          </button>
          <button className="btn-primary" onClick={togglePlay} style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
          </button>
          <button className="btn-secondary btn-sm" onClick={() => skipTo(Math.min(script.segments.length - 1, currentSegment + 1))} disabled={currentSegment === script.segments.length - 1}>
            <SkipForward size={14} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--grey-900)" }}>{script.title}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
            {script.duration} • Segment {currentSegment + 1}/{script.segments.length}
          </div>
          <div style={{ marginTop: "0.375rem", height: 3, borderRadius: 2, background: "var(--border-light)" }}>
            <div style={{ width: `${((currentSegment + 1) / script.segments.length) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>

        <button onClick={() => setMuted(!muted)} style={{ background: "none", padding: "0.25rem", color: "var(--grey-600)" }}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {script.segments.map((seg, i) => {
          const active = i === currentSegment;
          const typeColor = TYPE_COLORS[seg.type] || "var(--grey-600)";
          return (
            <div key={i} onClick={() => skipTo(i)} className="card" style={{
              padding: "0.75rem",
              cursor: "pointer",
              borderLeft: active ? `3px solid ${typeColor}` : "3px solid transparent",
              background: active ? "var(--primary-light)" : "var(--bg-card)",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: typeColor }}>{seg.label}</span>
                {active && playing && <span style={{ fontSize: "0.563rem", color: "var(--primary)", fontWeight: 500 }}>● Playing</span>}
              </div>
              <p style={{ fontSize: "0.75rem", color: active ? "var(--grey-900)" : "var(--text-secondary)", lineHeight: 1.5 }}>{seg.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
