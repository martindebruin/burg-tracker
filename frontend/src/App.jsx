import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { CruPage } from "./pages/CruPage";
import { MapPage } from "./pages/MapPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";

function TopBar() {
  const { user, logout } = useAuth();

  if (!user) return null; // Don't show topbar on login page

  return (
    <div className="topbar">
      <Link to="/" className="topbar-brand">
        🍷 Bourgogne
      </Link>
      <nav className="topbar-nav">
        <Link to="/" className="nav-link">Alla crus</Link>
        <Link to="/map" className="nav-link">🗺 Karta</Link>
        {user.is_admin && (
          <Link to="/admin" className="nav-link">Admin</Link>
        )}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: '#fff' }}>👤 {user.username}</span>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Logga ut
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="layout">
          <TopBar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/cru/:id" element={<ProtectedRoute><CruPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
