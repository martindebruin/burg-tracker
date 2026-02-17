import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { RatingDisplay } from "../components/RatingWidget";
import { NoteForm } from "../components/NoteForm";
import { TerroirForm } from "../components/TerroirForm";

export function CruPage() {
  const { id } = useParams();
  const [cru, setCru] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingTerroir, setEditingTerroir] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCru(id), api.getNotes(parseInt(id))])
      .then(([cruData, notesData]) => {
        setCru(cruData);
        setNotes(notesData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSaved(saved) {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingNote(null);
  }

  async function handleDelete(noteId) {
    if (!confirm("Ta bort denna provanteckning?")) return;
    await api.deleteNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function handleTerroirSaved(updated) {
    setCru(updated);
    setEditingTerroir(false);
  }

  if (loading) return <div className="page"><p className="empty">Loading…</p></div>;
  if (error)   return <div className="page"><p className="empty" style={{ color: "var(--rating-neg)" }}>{error}</p></div>;
  if (!cru)    return null;

  const hasTasted = notes.length > 0;

  return (
    <div className="page">
      {/* Back */}
      <div style={{ marginBottom: "1.25rem" }}>
        <Link to="/" className="back-link">← Alla crus</Link>
      </div>

      {/* Header */}
      <div className="card">
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className={`badge badge-${cru.type}`}>
                {cru.type === "grand" ? "Grand Cru" : "Premier Cru"}
              </span>
              {cru.color && <span className="badge badge-color">{cru.color}</span>}
              {hasTasted && <span className="badge badge-tasted">Provad</span>}
            </div>
            <h1 style={{ marginBottom: "0.4rem" }}>{cru.name}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {cru.commune} · {cru.subregion} · {cru.region}
            </p>
          </div>

          {hasTasted && (
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {notes.length} provning{notes.length > 1 ? "ar" : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terroir */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Terroir</h2>
          {!editingTerroir && (
            <button onClick={() => setEditingTerroir(true)}>
              ✏️ Redigera
            </button>
          )}
        </div>

        {editingTerroir ? (
          <TerroirForm
            cruId={cru.id}
            data={cru}
            onSaved={handleTerroirSaved}
            onCancel={() => setEditingTerroir(false)}
          />
        ) : (
          <>
            <div className="terroir-grid">
              <div className="fact-card">
                <div className="fact-label">Jordmån</div>
                <div className={`fact-value${!cru.soil_type ? " unknown" : ""}`}>
                  {cru.soil_type || "Okänd"}
                </div>
              </div>
              <div className="fact-card">
                <div className="fact-label">Höjd</div>
                <div className={`fact-value${!cru.elevation_m ? " unknown" : ""}`}>
                  {cru.elevation_m ? `~${cru.elevation_m} m` : "Okänd"}
                </div>
              </div>
              <div className="fact-card">
                <div className="fact-label">Exponering</div>
                <div className={`fact-value${!cru.aspect ? " unknown" : ""}`}>
                  {cru.aspect || "Okänd"}
                </div>
              </div>
              <div className="fact-card">
                <div className="fact-label">Areal</div>
                <div className={`fact-value${!cru.area_ha ? " unknown" : ""}`}>
                  {cru.area_ha ? `${parseFloat(cru.area_ha).toFixed(2)} ha` : "Okänd"}
                </div>
              </div>
            </div>
            {cru.climate_notes && (
              <div className="climate-block">{cru.climate_notes}</div>
            )}
          </>
        )}
      </div>

      {/* Tasting notes */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>Provanteckningar</h2>
        {!showForm && !editingNote && (
          <button className="primary" onClick={() => setShowForm(true)}>
            + Lägg till
          </button>
        )}
      </div>

      {/* Add note form */}
      {showForm && !editingNote && (
        <div className="card">
          <NoteForm
            cruId={cru.id}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Existing notes */}
      {notes.length === 0 && !showForm ? (
        <p className="empty">Inga anteckningar ännu. Klicka "Lägg till" för att registrera din första provning.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id}>
            {editingNote?.id === n.id ? (
              <div className="card">
                <NoteForm
                  cruId={cru.id}
                  note={n}
                  onSaved={handleSaved}
                  onCancel={() => setEditingNote(null)}
                />
              </div>
            ) : (
              <div className="note-card">
                <div className="note-meta">
                  {n.vintage && <span>Vintage <strong>{n.vintage}</strong></span>}
                  <span>
                    {new Date(n.tasted_on).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  {n.rating !== null && n.rating !== undefined && (
                    <RatingDisplay value={n.rating} />
                  )}
                </div>
                {n.notes && <p style={{ margin: 0 }}>{n.notes}</p>}
                <div className="note-actions">
                  <button onClick={() => setEditingNote(n)}>Redigera</button>
                  <button className="danger" onClick={() => handleDelete(n.id)}>Ta bort</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
