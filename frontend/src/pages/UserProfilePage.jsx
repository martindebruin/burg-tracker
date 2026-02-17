import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'

export function UserProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [topWines, setTopWines] = useState({ red: [], white: [] })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileData, winesData] = await Promise.all([
        api.getUserProfile(username),
        api.getTopWines(username)
      ])
      setProfile(profileData)
      setTopWines(winesData)
    } catch (err) {
      setError(err.message || 'Kunde inte ladda profil')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="empty">Laddar profil...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <p className="empty" style={{ color: 'var(--rating-neg)' }}>{error}</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="page">
      {/* Back link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/" className="back-link">← Alla crus</Link>
      </div>

      {/* Profile Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #fff8f0 0%, #ffffff 100%)',
        border: '2px solid var(--gold)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0 }}>
                {profile.nickname || profile.username}
              </h1>
              {profile.nickname && (
                <span style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
                  @{profile.username}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: 0 }}>
              Medlem sedan {new Date(profile.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setEditing(!editing)}
              className="primary"
            >
              {editing ? '✕ Avbryt' : '✏️ Redigera profil'}
            </button>
          )}
        </div>

        {editing ? (
          <ProfileEditForm
            profile={profile}
            onSuccess={(updated) => {
              setProfile({ ...profile, ...updated })
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            {/* Bio */}
            {profile.bio && (
              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <StatCard label="Provningar" value={profile.stats.total_notes} />
              <StatCard label="Crus provade" value={profile.stats.crus_tasted} />
              <StatCard
                label="Genomsnitt"
                value={profile.stats.avg_rating ? profile.stats.avg_rating.toFixed(1) : 'N/A'}
              />
            </div>

            {/* Social Links */}
            <SocialLinks profile={profile} />
          </>
        )}
      </div>

      {/* Top Wines */}
      {!editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <TopWinesCard title="🍷 Top 3 Röda" wines={topWines.red} />
          <TopWinesCard title="🥂 Top 3 Vita" wines={topWines.white} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{
      padding: '1rem',
      background: 'white',
      borderRadius: '12px',
      textAlign: 'center',
      border: '1px solid var(--border)'
    }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--burgundy)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}

function SocialLinks({ profile }) {
  const links = [
    { url: profile.mastodon_url, icon: '🐘', label: 'Mastodon' },
    { url: profile.bluesky_url, icon: '🦋', label: 'Bluesky' },
    { url: profile.vivino_url, icon: '🍷', label: 'Vivino' },
    { url: profile.cellartracker_url, icon: '📊', label: 'CellarTracker' },
    { url: profile.delectable_url, icon: '🍇', label: 'Delectable' },
  ].filter(link => link.url)

  if (links.length === 0) return null

  return (
    <div>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Sociala länkar
      </h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              fontSize: '0.9rem',
              textDecoration: 'none',
              color: 'var(--text)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--burgundy)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function TopWinesCard({ title, wines }) {
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      {wines.length === 0 ? (
        <p className="empty">Inga viner ännu</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wines.map((wine, i) => (
            <Link
              key={wine.id}
              to={`/cru/${wine.id}`}
              style={{
                display: 'block',
                padding: '1rem',
                background: 'var(--cream)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--burgundy)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    #{i + 1}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                    {wine.name}
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: wine.rating >= 1 ? 'var(--rating-pos)' : wine.rating <= -1 ? 'var(--rating-neg)' : 'var(--muted)',
                  background: wine.rating >= 1 ? '#e6f7ed' : wine.rating <= -1 ? '#fee' : '#f5f5f5'
                }}>
                  {wine.rating > 0 ? '+' : ''}{wine.rating}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {wine.commune} · {wine.vintage || 'N/A'} · {new Date(wine.tasted_on).toLocaleDateString('sv-SE')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileEditForm({ profile, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nickname: profile.nickname || '',
    bio: profile.bio || '',
    mastodon_url: profile.mastodon_url || '',
    bluesky_url: profile.bluesky_url || '',
    vivino_url: profile.vivino_url || '',
    cellartracker_url: profile.cellartracker_url || '',
    delectable_url: profile.delectable_url || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const updated = await api.updateMyProfile(formData)
      onSuccess(updated)
    } catch (err) {
      setError(err.message || 'Kunde inte uppdatera profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid var(--border)'
    }}>
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

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            Smeknamn
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={e => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="Ditt visningsnamn"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Berätta något om dig själv..."
            rows={4}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--muted)' }}>Sociala länkar</h3>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                🐘 Mastodon
              </label>
              <input
                type="url"
                value={formData.mastodon_url}
                onChange={e => setFormData({ ...formData, mastodon_url: e.target.value })}
                placeholder="https://mastodon.social/@username"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                🦋 Bluesky
              </label>
              <input
                type="url"
                value={formData.bluesky_url}
                onChange={e => setFormData({ ...formData, bluesky_url: e.target.value })}
                placeholder="https://bsky.app/profile/username"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                🍷 Vivino
              </label>
              <input
                type="url"
                value={formData.vivino_url}
                onChange={e => setFormData({ ...formData, vivino_url: e.target.value })}
                placeholder="https://www.vivino.com/users/username"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                📊 CellarTracker
              </label>
              <input
                type="url"
                value={formData.cellartracker_url}
                onChange={e => setFormData({ ...formData, cellartracker_url: e.target.value })}
                placeholder="https://www.cellartracker.com/user/username"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                🍇 Delectable
              </label>
              <input
                type="url"
                value={formData.delectable_url}
                onChange={e => setFormData({ ...formData, delectable_url: e.target.value })}
                placeholder="https://delectable.com/profile/username"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" disabled={loading} className="primary">
            {loading ? 'Sparar...' : 'Spara ändringar'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}>
            Avbryt
          </button>
        </div>
      </div>
    </form>
  )
}
