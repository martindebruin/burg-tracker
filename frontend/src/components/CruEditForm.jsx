import { useState } from 'react'
import { api } from '../api'

export function CruEditForm({ cru, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    name: cru.name || '',
    color: cru.color || '',
    type: cru.type || 'premier',
    subregion: cru.subregion || '',
    commune: cru.commune || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const updates = {}
      // Only include changed fields
      if (formData.name !== cru.name) updates.name = formData.name
      if (formData.color !== cru.color) updates.color = formData.color
      if (formData.type !== cru.type) updates.type = formData.type
      if (formData.subregion !== cru.subregion) updates.subregion = formData.subregion
      if (formData.commune !== cru.commune) updates.commune = formData.commune

      if (Object.keys(updates).length === 0) {
        onCancel()
        return
      }

      const updated = await api.updateCru(cru.id, updates)
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Namn
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
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
          Färg
        </label>
        <select
          value={formData.color}
          onChange={e => setFormData({ ...formData, color: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="">Okänd</option>
          <option value="rouge">Rött</option>
          <option value="blanc">Vitt</option>
          <option value="both">Både rött och vitt</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Typ
        </label>
        <select
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="grand">Grand Cru</option>
          <option value="premier">Premier Cru</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Subregion
        </label>
        <input
          type="text"
          value={formData.subregion}
          onChange={e => setFormData({ ...formData, subregion: e.target.value })}
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
          Kommun
        </label>
        <input
          type="text"
          value={formData.commune}
          onChange={e => setFormData({ ...formData, commune: e.target.value })}
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

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1,
            padding: '0.875rem',
            background: '#6b2737',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Sparar...' : 'Spara'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1,
            padding: '0.875rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          Avbryt
        </button>
      </div>
    </form>
  )
}
