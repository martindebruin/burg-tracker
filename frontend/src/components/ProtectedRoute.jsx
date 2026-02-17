import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Laddar...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !user.is_admin) {
    return (
      <div className="page">
        <p className="empty">Åtkomst nekad. Endast administratörer.</p>
      </div>
    )
  }

  return children
}
