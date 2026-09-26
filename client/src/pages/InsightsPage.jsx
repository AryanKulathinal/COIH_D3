import { useState } from "react";
import { Layers, Headphones, HelpCircle, BarChart3 } from "lucide-react";
import Flashcards from "../components/Flashcards.jsx";
import AudioOverview from "../components/AudioOverview.jsx";
import Quiz from "../components/Quiz.jsx";
import Infographic from "../components/Infographic.jsx";

const TABS = [
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "audio", label: "Audio Brief", icon: Headphones },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "infographic", label: "Infographic", icon: BarChart3 },
];

const LEAVE = { leaveStart: "2025-04-01", leaveEnd: "2025-04-14" };

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("flashcards");

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.125rem" }}>Insights & Learning</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Multiple ways to catch up — choose what works best for you</p>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              padding: "0.375rem 0.75rem", borderRadius: "var(--radius-md)",
              fontSize: "0.75rem", fontWeight: active ? 600 : 400,
              background: active ? "var(--primary-light)" : "transparent",
              color: active ? "var(--primary)" : "var(--grey-600)",
              border: "none", cursor: "pointer",
            }}>
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "flashcards" && <Flashcards {...LEAVE} />}
      {activeTab === "audio" && <AudioOverview {...LEAVE} />}
      {activeTab === "quiz" && <Quiz {...LEAVE} />}
      {activeTab === "infographic" && <Infographic {...LEAVE} />}
    </div>
  );
}
