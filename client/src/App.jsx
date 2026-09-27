import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Plane, MessageCircleQuestion, Database, LayoutDashboard, Zap, Plug } from "lucide-react";
import { api } from "./services/api.js";
import Dashboard from "./pages/Dashboard.jsx";
import BriefPage from "./pages/BriefPage.jsx";
import QAPage from "./pages/QAPage.jsx";
import CapturePage from "./pages/CapturePage.jsx";
import ConnectorsPage from "./pages/ConnectorsPage.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/brief", label: "Return Brief", icon: Plane },
  { to: "/qa", label: "Ask Questions", icon: MessageCircleQuestion },
  { to: "/capture", label: "Knowledge", icon: Database },
  { to: "/connectors", label: "Connectors", icon: Plug },
];

function App() {
  const [mode, setMode] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.getMode().then(setMode).catch(() => setMode({ mode: "demo" }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        height: "3rem",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "1.625rem", height: "1.625rem", borderRadius: "0.3rem",
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.813rem", color: "var(--primary-900)" }}>COIH</span>
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginLeft: "0.125rem" }}>Central Operational Intelligence Hub</span>
        </div>

        <nav style={{ display: "flex", gap: "0.25rem", alignSelf: "stretch" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                fontSize: "0.688rem", fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--primary)" : "var(--grey-600)",
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                padding: "0 0.625rem",
                textDecoration: "none",
                transition: "color 0.15s",
              }}>
                <item.icon size={13} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {mode && (
            <span style={{
              padding: "0.125rem 0.5rem", borderRadius: "var(--radius-full)",
              fontSize: "0.563rem", fontWeight: 600, letterSpacing: "0.03em",
              background: mode.mode === "live" ? "var(--success-light)" : "var(--warning-light)",
              color: mode.mode === "live" ? "var(--success)" : "var(--warning-dark)",
            }}>
              {mode.mode === "live" ? "LIVE" : "DEMO"}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{
              width: "1.75rem", height: "1.75rem", borderRadius: "50%",
              background: "var(--primary-900)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.625rem", fontWeight: 600, color: "white",
            }}>PS</div>
            <div>
              <div style={{ fontSize: "0.688rem", fontWeight: 500, color: "var(--grey-800)", lineHeight: 1.2 }}>Priya Sharma</div>
              <div style={{ fontSize: "0.563rem", color: "var(--text-muted)", lineHeight: 1.2 }}>Team Alpha</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: "1.25rem 1.5rem", overflow: "auto" }}>
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/brief" element={<BriefPage />} />
            <Route path="/brief/:id" element={<BriefPage />} />
            <Route path="/qa" element={<QAPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/connectors" element={<ConnectorsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
