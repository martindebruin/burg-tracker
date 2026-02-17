import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'

export function LoginPage() {
  const [tab, setTab] = useState('login')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6b2737 0%, #4a1f29 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>🍷 Bourgogne</h1>

        <div className="tab-buttons" style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <button
            onClick={() => setTab('login')}
            className={tab === 'login' ? 'active' : ''}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: 'none',
              borderBottom: tab === 'login' ? '2px solid #6b2737' : 'none',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontWeight: tab === 'login' ? 600 : 400,
              color: tab === 'login' ? '#6b2737' : '#6b7280'
            }}
          >
            Logga in
          </button>
          <button
            onClick={() => setTab('register')}
            className={tab === 'register' ? 'active' : ''}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: 'none',
              borderBottom: tab === 'register' ? '2px solid #6b2737' : 'none',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontWeight: tab === 'register' ? 600 : 400,
              color: tab === 'register' ? '#6b2737' : '#6b7280'
            }}
          >
            Registrera
          </button>
        </div>

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

        {tab === 'login' ? (
          <LoginForm login={login} navigate={navigate} setError={setError} />
        ) : (
          <RegisterForm setTab={setTab} setError={setError} />
        )}
      </div>
    </div>
  )
}

function LoginForm({ login, navigate, setError }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Inloggningen misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Användarnamn
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Lösenord
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.875rem',
          background: '#6b2737',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        {loading ? 'Loggar in...' : 'Logga in'}
      </button>
    </form>
  )
}

function RegisterForm({ setTab, setError }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register({ username, email, password })
      setError('')
      setTab('login')
      alert('Konto skapat! Du kan nu logga in.')
    } catch (err) {
      setError(err.message || 'Registreringen misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Användarnamn
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
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          E-post
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Lösenord (minst 8 tecken)
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
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.875rem',
          background: '#6b2737',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        {loading ? 'Registrerar...' : 'Registrera'}
      </button>
    </form>
  )
}
