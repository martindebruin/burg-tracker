import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { HomePage } from "./pages/HomePage";
import { CruPage } from "./pages/CruPage";
import { MapPage } from "./pages/MapPage";
import { api } from "./api";

function TopBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="topbar">
      <Link to="/" className="topbar-brand">
        🍷 Bourgogne
      </Link>
      <nav className="topbar-nav">
        <Link to="/" className="nav-link">Alla crus</Link>
        <Link to="/map" className="nav-link">🗺 Karta</Link>
      </nav>
      {stats && (
        <div className="topbar-stats">
          <span className="stat-chip stat-chip-grand">{stats.grand_crus} Grand Crus</span>
          <span className="stat-chip stat-chip-premier">{stats.premier_crus} Premier Crus</span>
          <span className="stat-chip stat-chip-tasted">✓ {stats.crus_tasted} provade</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <TopBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cru/:id" element={<CruPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
