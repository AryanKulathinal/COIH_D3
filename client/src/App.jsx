import { useState } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Plane, MessageCircleQuestion, LayoutDashboard, Zap, Plug, Siren, BookOpen, GraduationCap, ChevronDown, RotateCcw, Presentation } from "lucide-react";
import { config, getAccount } from "./data.js";
import { useSession } from "./context/SessionContext.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BriefPage from "./pages/BriefPage.jsx";
import QAPage from "./pages/QAPage.jsx";
import ConnectorsPage from "./pages/ConnectorsPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import KnowledgePage from "./pages/KnowledgePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import GuidedDemo from "./components/GuidedDemo.jsx";
import { SourceDrawerProvider } from "./components/SourceDrawer.jsx";

const NAV_ITEMS = [
  { to: "/home", label: "Home", icon: LayoutDashboard },
  { to: "/brief", label: "Return Brief", icon: Plane, when: (p) => Boolean(p.leave) },
  { to: "/onboarding", label: "Onboarding", icon: GraduationCap, when: (p) => p.scenario === "newjoiner" },
  { to: "/ask", label: "Ask", icon: MessageCircleQuestion },
  { to: "/incidents", label: "Incidents", icon: Siren },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/connectors", label: "Connectors", icon: Plug },
];

function PersonaSwitcher() {
  const { persona, account, selectPersona, clearPersona, resetDemo } = useSession();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const choose = (p) => {
    selectPersona(p.id);
    setOpen(false);
    navigate(p.home);
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", padding: "0.25rem" }}>
        <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: account.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 600, color: "white" }}>
          {persona.initials}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.688rem", fontWeight: 500, color: "var(--grey-800)", lineHeight: 1.2 }}>{persona.name}</div>
          <div style={{ fontSize: "0.563rem", color: "var(--text-muted)", lineHeight: 1.2 }}>{persona.scenarioLabel}</div>
        </div>
        <ChevronDown size={13} color="var(--grey-600)" />
      </button>
      {open && (
        <div className="card fade-in" style={{ position: "absolute", right: 0, top: "2.5rem", width: "16rem", padding: "0.375rem", zIndex: 50, boxShadow: "var(--shadow-lg)" }}>
          <div style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", padding: "0.25rem 0.5rem" }}>Switch persona</div>
          {config.personas.map((p) => {
            const a = getAccount(p.account);
            return (
              <button key={p.id} onClick={() => choose(p)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-md)", background: p.id === persona.id ? "var(--primary-light)" : "none", textAlign: "left" }}>
                <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: a.color }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: "0.688rem", color: "var(--grey-900)" }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: "0.563rem", color: "var(--text-muted)" }}>{a.name} · {p.scenarioLabel}</span>
                </span>
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border-light)", margin: "0.25rem 0" }} />
          <button onClick={() => { setOpen(false); clearPersona(); navigate("/"); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem", width: "100%", padding: "0.375rem 0.5rem", background: "none", fontSize: "0.688rem", color: "var(--grey-700)" }}>
            <Presentation size={13} /> Back to intro
          </button>
          <button onClick={() => { setOpen(false); resetDemo(); navigate("/"); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem", width: "100%", padding: "0.375rem 0.5rem", background: "none", fontSize: "0.688rem", color: "var(--error-dark)" }}>
            <RotateCcw size={13} /> Reset demo (clears captured knowledge)
          </button>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { persona, account } = useSession();
  const location = useLocation();
  const items = NAV_ITEMS.filter((i) => !i.when || i.when(persona));

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "3rem", flexShrink: 0, position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "1.625rem", height: "1.625rem", borderRadius: "0.3rem", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.813rem", color: "var(--primary-900)" }}>COIH</span>
          <span className="badge" style={{ background: `${account.color}1a`, color: account.color, fontWeight: 600 }} title={account.domain}>
            {account.name} · {account.client}
          </span>
        </div>

        <nav style={{ display: "flex", gap: "0.25rem", alignSelf: "stretch" }}>
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                fontSize: "0.688rem", fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--primary)" : "var(--grey-600)",
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                padding: "0 0.625rem", textDecoration: "none", transition: "color 0.15s",
              }}>
                <item.icon size={13} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <PersonaSwitcher />
      </header>

      <main style={{ flex: 1, padding: "1.25rem 1.5rem 5rem" }}>
        <div className="page-container">
          <Routes>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/brief" element={persona.leave ? <BriefPage /> : <Navigate to="/home" replace />} />
            <Route path="/ask" element={<QAPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/connectors" element={<ConnectorsPage />} />
            <Route path="*" element={<Navigate to={persona.home} replace />} />
          </Routes>
        </div>
      </main>
      <GuidedDemo />
    </div>
  );
}

export default function App() {
  const { persona } = useSession();
  const location = useLocation();
  if (!persona) return location.pathname === "/" ? <Landing /> : <Navigate to="/" replace />;
  return (
    <SourceDrawerProvider>
      <Shell />
    </SourceDrawerProvider>
  );
}
