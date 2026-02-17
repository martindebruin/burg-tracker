import { useState } from "react";
import { api } from "../api";

export function TerroirForm({ cruId, data, onSaved, onCancel }) {
  const [form, setForm] = useState({
    soil_type: data?.soil_type ?? "",
    elevation_m: data?.elevation_m ?? "",
    aspect: data?.aspect ?? "",
    climate_notes: data?.climate_notes ?? "",
    area_ha: data?.area_ha ?? "",
    latitude: data?.latitude ?? "",
    longitude: data?.longitude ?? "",
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
        soil_type: form.soil_type || null,
        elevation_m: form.elevation_m ? parseInt(form.elevation_m) : null,
        aspect: form.aspect || null,
        climate_notes: form.climate_notes || null,
        area_ha: form.area_ha ? parseFloat(form.area_ha) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };

      const updated = await api.updateCru(cruId, payload);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="note-form" onSubmit={submit}>
      <div>
        <label className="form-label">Jordmån</label>
        <textarea
          rows="2"
          placeholder="t.ex. Kalksten, lerkalksten..."
          value={form.soil_type}
          onChange={(e) => set("soil_type", e.target.value)}
        />
      </div>

      <div className="form-row">
        <div>
          <label className="form-label">Höjd (m)</label>
          <input
            type="number"
            placeholder="280"
            value={form.elevation_m}
            onChange={(e) => set("elevation_m", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Areal (ha)</label>
          <input
            type="number"
            step="0.01"
            placeholder="12.50"
            value={form.area_ha}
            onChange={(e) => set("area_ha", e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label className="form-label">Latitud</label>
          <input
            type="number"
            step="0.000001"
            placeholder="47.2270"
            value={form.latitude}
            onChange={(e) => set("latitude", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Longitud</label>
          <input
            type="number"
            step="0.000001"
            placeholder="4.9712"
            value={form.longitude}
            onChange={(e) => set("longitude", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Exponering</label>
        <input
          type="text"
          placeholder="t.ex. öst till sydost"
          value={form.aspect}
          onChange={(e) => set("aspect", e.target.value)}
        />
      </div>

      <div>
        <label className="form-label">Klimatnoteringar</label>
        <textarea
          rows="2"
          placeholder="t.ex. Kontinentalt; varma somrar, kalla vintrar..."
          value={form.climate_notes}
          onChange={(e) => set("climate_notes", e.target.value)}
        />
      </div>

      {error && (
        <p style={{ color: "var(--rating-neg)", margin: 0, fontSize: "0.85rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Sparar…" : "Spara"}
        </button>
        <button type="button" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
