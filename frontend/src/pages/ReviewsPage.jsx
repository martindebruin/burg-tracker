import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export function ReviewsPage() {
  const [color, setColor] = useState('rouge')
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [topWines, setTopWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [color])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reviewsData, topWinesData] = await Promise.all([
        api.getReviewsByColor(color),
        api.getTopWinesByColor(color, 10)
      ])
      setStats(reviewsData.stats)
      setReviews(reviewsData.reviews)
      setTopWines(topWinesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.5rem' }}>Alla recensioner</h1>

      {/* Color selector */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setColor('rouge')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: 'none',
            borderBottom: color === 'rouge' ? '3px solid #6b2737' : 'none',
            marginBottom: '-2px',
            cursor: 'pointer',
            fontWeight: color === 'rouge' ? 600 : 400,
            fontSize: '1.1rem',
            color: color === 'rouge' ? '#6b2737' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          🍷 Rödviner
        </button>
        <button
          onClick={() => setColor('blanc')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: 'none',
            borderBottom: color === 'blanc' ? '3px solid #6b2737' : 'none',
            marginBottom: '-2px',
            cursor: 'pointer',
            fontWeight: color === 'blanc' ? 600 : 400,
            fontSize: '1.1rem',
            color: color === 'blanc' ? '#6b2737' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          🥂 Vitviner
        </button>
      </div>

      {loading && <p className="empty">Laddar...</p>}
      {error && <p className="empty" style={{ color: 'var(--rating-neg)' }}>{error}</p>}

      {!loading && !error && stats && (
        <>
          {/* Statistics */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Sammanställning</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                background: 'linear-gradient(155deg, #fff8e8 0%, #faecd0 100%)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Totalt antal recensioner
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#6b2737' }}>
                  {stats.total_reviews || 0}
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(155deg, #fff8e8 0%, #faecd0 100%)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Unika viner
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#6b2737' }}>
                  {stats.unique_wines || 0}
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(155deg, #fff8e8 0%, #faecd0 100%)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Genomsnittligt betyg
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#6b2737' }}>
                  {stats.avg_rating ? stats.avg_rating.toFixed(2) : 'N/A'}
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(155deg, #fff8e8 0%, #faecd0 100%)',
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Antal recensenter
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#6b2737' }}>
                  {stats.reviewers || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Top wines */}
          {topWines.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Topprankade viner</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topWines.map((wine, idx) => (
                  <Link
                    key={wine.id}
                    to={`/cru/${wine.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: idx < 3 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 39, 55, 0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: idx === 0 ? '#d4af37' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#6b7280',
                      minWidth: '2rem',
                      textAlign: 'center'
                    }}>
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {wine.name}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        {wine.commune} · {wine.subregion}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        color: wine.avg_rating >= 1 ? '#059669' : wine.avg_rating <= -1 ? '#dc2626' : '#6b7280'
                      }}>
                        {wine.avg_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {wine.review_count} recension{wine.review_count > 1 ? 'er' : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All reviews */}
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Alla recensioner</h2>
            {reviews.length === 0 ? (
              <p className="empty">Inga recensioner ännu.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      background: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      <Link
                        to={`/cru/${review.cru.id}`}
                        style={{
                          color: '#6b2737',
                          fontWeight: 600,
                          textDecoration: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        {review.cru.name}
                      </Link>
                      <span className={`badge badge-${review.cru.type}`}>
                        {review.cru.type === 'grand' ? 'Grand Cru' : 'Premier Cru'}
                      </span>
                      <span>·</span>
                      <span>{review.cru.commune}</span>
                      {review.vintage && (
                        <>
                          <span>·</span>
                          <span>Årgång {review.vintage}</span>
                        </>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      <Link
                        to={`/profile/${review.user.username}`}
                        style={{
                          color: '#6b2737',
                          fontWeight: 500,
                          textDecoration: 'none'
                        }}
                      >
                        👤 {review.user.nickname || review.user.username}
                      </Link>
                      <span>·</span>
                      <span>{new Date(review.tasted_on).toLocaleDateString('sv-SE')}</span>
                      {review.rating !== null && review.rating !== undefined && (
                        <>
                          <span>·</span>
                          <span style={{
                            color: review.rating >= 1 ? '#059669' : review.rating <= -1 ? '#dc2626' : '#6b7280',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                          }}>
                            Betyg: {review.rating > 0 ? '+' : ''}{review.rating}
                          </span>
                        </>
                      )}
                    </div>

                    {review.notes && (
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {review.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
