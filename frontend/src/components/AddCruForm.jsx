import { useState } from "react";
import { api } from "../api";

export function AddCruForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    type: "premier",
    region: "Bourgogne",
    subregion: "",
    commune: "",
    color: "",
    latitude: "",
    longitude: "",
    soil_type: "",
    elevation_m: "",
    aspect: "",
    climate_notes: "",
    area_ha: "",
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
        name: form.name,
        type: form.type,
        region: form.region || "Bourgogne",
        subregion: form.subregion,
        commune: form.commune,
        color: form.color || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        soil_type: form.soil_type || null,
        elevation_m: form.elevation_m ? parseInt(form.elevation_m) : null,
        aspect: form.aspect || null,
        climate_notes: form.climate_notes || null,
        area_ha: form.area_ha ? parseFloat(form.area_ha) : null,
      };

      const created = await api.createCru(payload);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="note-form" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Lägg till ny cru</h3>

      {/* Basic info */}
      <div className="form-row">
        <div>
          <label className="form-label">Namn *</label>
          <input
            type="text"
            required
            placeholder="t.ex. Chambertin"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Typ *</label>
          <select
            required
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="grand">Grand Cru</option>
            <option value="premier">Premier Cru</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div>
          <label className="form-label">Delregion *</label>
          <input
            type="text"
            required
            placeholder="t.ex. Côte de Nuits"
            value={form.subregion}
            onChange={(e) => set("subregion", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Kommun *</label>
          <input
            type="text"
            required
            placeholder="t.ex. Gevrey-Chambertin"
            value={form.commune}
            onChange={(e) => set("commune", e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label className="form-label">Färg</label>
          <select value={form.color} onChange={(e) => set("color", e.target.value)}>
            <option value="">Okänd</option>
            <option value="rouge">Rött</option>
            <option value="blanc">Vitt</option>
            <option value="both">Röd & Vit</option>
          </select>
        </div>
        <div>
          <label className="form-label">Region</label>
          <input
            type="text"
            placeholder="Bourgogne"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
          />
        </div>
      </div>

      {/* Coordinates */}
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

      {/* Terroir */}
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
          {saving ? "Skapar…" : "Skapa cru"}
        </button>
        <button type="button" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
