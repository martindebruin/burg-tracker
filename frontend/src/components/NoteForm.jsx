import { useState } from "react";
import { RatingWidget } from "./RatingWidget";
import { api } from "../api";

const CURRENT_YEAR = new Date().getFullYear();

export function NoteForm({ cruId, note, onSaved, onCancel }) {
  const [form, setForm] = useState({
    vintage:  note?.vintage  ?? "",
    tasted_on: note?.tasted_on ?? new Date().toISOString().split("T")[0],
    rating:   note?.rating   ?? null,
    notes:    note?.notes    ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        cru_id:    cruId,
        vintage:   form.vintage ? parseInt(form.vintage) : null,
        tasted_on: form.tasted_on || undefined,
        rating:    form.rating,
        notes:     form.notes || null,
      };
      const saved = note?.id
        ? await api.updateNote(note.id, payload)
        : await api.createNote(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="note-form" onSubmit={submit}>
      <div className="form-row">
        <div>
          <label className="form-label">Årgång</label>
          <input
            type="number"
            min="1850"
            max={CURRENT_YEAR}
            placeholder={String(CURRENT_YEAR)}
            value={form.vintage}
            onChange={(e) => set("vintage", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Provdatum</label>
          <input
            type="date"
            value={form.tasted_on}
            onChange={(e) => set("tasted_on", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="form-label">
          Betyg &nbsp;
          <span className="muted" style={{ fontStyle: "italic" }}>
            (0 = som förväntat)
          </span>
        </label>
        <RatingWidget value={form.rating} onChange={(v) => set("rating", v)} />
      </div>

      <div>
        <label className="form-label">Anteckningar</label>
        <textarea
          placeholder="Aromer, smak, avslut, producent…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {error && <p style={{ color: "var(--rating-neg)", margin: 0, fontSize: "0.85rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Sparar…" : note?.id ? "Uppdatera" : "Lägg till"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Avbryt
          </button>
        )}
      </div>
    </form>
  );
}
