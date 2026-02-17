import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { CruPage } from "./pages/CruPage";
import { MapPage } from "./pages/MapPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ReviewsPage } from "./pages/ReviewsPage";

function TopBar() {
  const { user, logout } = useAuth();

  if (!user) return null; // Don't show topbar on login page

  return (
    <div className="topbar">
      <Link to="/" className="topbar-brand">
        Bourgogne
      </Link>
      <nav className="topbar-nav">
        <Link to="/" className="nav-link">Alla crus</Link>
        <Link to="/reviews" className="nav-link">🍷 Recensioner</Link>
        <Link to="/map" className="nav-link">🗺 Karta</Link>
        <Link to={`/profile/${user.username}`} className="nav-link">Min profil</Link>
        {user.is_admin && (
          <Link to="/admin" className="nav-link">Admin</Link>
        )}
      </nav>
      <div className="topbar-user">
        <span className="topbar-username">👤 {user.username}</span>
        <button onClick={logout} className="topbar-logout">
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
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
