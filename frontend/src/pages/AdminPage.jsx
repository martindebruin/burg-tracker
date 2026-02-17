import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'

export function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers({ search })
      setUsers(data.items)
    } catch (err) {
      alert('Kunde inte ladda användare')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, username) => {
    if (!confirm(`Ta bort användare "${username}"?`)) return
    try {
      await api.deleteUser(userId)
      loadUsers()
    } catch (err) {
      alert('Kunde inte ta bort användare')
    }
  }

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Nytt lösenord för "${username}" (minst 8 tecken):`)
    if (!newPassword || newPassword.length < 8) return
    try {
      await api.resetUserPassword(userId, newPassword)
      alert('Lösenord uppdaterat!')
    } catch (err) {
      alert('Kunde inte återställa lösenord')
    }
  }

  if (!user?.is_admin) {
    return (
      <div className="page">
        <p className="empty">Åtkomst nekad.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>Användarhantering</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="primary"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem'
            }}
          >
            {showCreateForm ? '✕ Avbryt' : '+ Skapa användare'}
          </button>
        </div>

        {showCreateForm && (
          <CreateUserForm
            onSuccess={() => {
              setShowCreateForm(false)
              loadUsers()
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Sök användare..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Laddar...</p>
        ) : users.length === 0 ? (
          <p className="empty">Inga användare hittades.</p>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Användarnamn</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>E-post</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Admin</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Skapad</th>
                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{u.username}</td>
                  <td style={{ padding: '0.75rem' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {u.is_admin ? '✓ Ja' : '—'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    {new Date(u.created_at).toLocaleDateString('sv-SE')}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleResetPassword(u.id, u.username)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.85rem',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Återställ lösenord
                      </button>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.85rem',
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Ta bort
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CreateUserForm({ onSuccess, onCancel }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.createUser({ username, email, password, is_admin: isAdmin })
      alert(`Användare "${username}" skapad!`)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Kunde inte skapa användare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#f9fafb',
      padding: '1.5rem',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Skapa ny användare</h3>

      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Användarnamn *
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              E-post *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            Lösenord * (minst 8 tecken)
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Administratör</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={loading}
            className="primary"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Skapar...' : 'Skapa användare'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  )
}
