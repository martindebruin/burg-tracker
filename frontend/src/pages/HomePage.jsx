import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { RatingDisplay } from "../components/RatingWidget";
import { AddCruForm } from "../components/AddCruForm";

const PAGE_SIZE = 200;

function CruCard({ cru, onClick }) {
  const colorLabel = { rouge: "rött", blanc: "vitt", both: "röd & vit" };
  const hasTerroirData = cru.soil_type || cru.elevation_m || cru.aspect || cru.area_ha;

  return (
    <div
      className={`cru-card type-${cru.type}${cru.tasted ? " tasted" : ""}`}
      onClick={onClick}
    >
      <div className="card-badges">
        <span className={`badge badge-${cru.type}`}>
          {cru.type === "grand" ? "Grand Cru" : "1er Cru"}
        </span>
        {cru.color && (
          <span className="badge badge-color">{colorLabel[cru.color] ?? cru.color}</span>
        )}
        {cru.tasted && (
          <span className="badge badge-tasted">✓</span>
        )}
      </div>

      <div className="card-name">{cru.name}</div>
      <div className="card-location">{cru.commune} · {cru.subregion}</div>

      {hasTerroirData && (
        <div className="card-terroir">
          <div className="terroir-item">
            <span className="terroir-label">Jordmån</span>
            <span className={`terroir-value${!cru.soil_type ? " unknown" : ""}`}>
              {cru.soil_type ?? "Okänd"}
            </span>
          </div>
          <div className="terroir-item">
            <span className="terroir-label">Höjd</span>
            <span className={`terroir-value${!cru.elevation_m ? " unknown" : ""}`}>
              {cru.elevation_m ? `~${cru.elevation_m} m` : "Okänd"}
            </span>
          </div>
          <div className="terroir-item">
            <span className="terroir-label">Exponering</span>
            <span className={`terroir-value${!cru.aspect ? " unknown" : ""}`}>
              {cru.aspect ?? "Okänd"}
            </span>
          </div>
          <div className="terroir-item">
            <span className="terroir-label">Areal</span>
            <span className={`terroir-value${!cru.area_ha ? " unknown" : ""}`}>
              {cru.area_ha ? `${parseFloat(cru.area_ha).toFixed(2)} ha` : "Okänd"}
            </span>
          </div>
        </div>
      )}

      {cru.tasted && cru.best_rating !== null && cru.best_rating !== undefined && (
        <div className="card-rating">
          <RatingDisplay value={cru.best_rating} />
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [crus, setCrus] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [subregion, setSubregion] = useState("");
  const [commune, setCommune] = useState("");
  const [tastedFilter, setTastedFilter] = useState(null);

  const [subregions, setSubregions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    api.getSubregions().then(setSubregions);
  }, []);

  useEffect(() => {
    api.getCommunes(subregion || undefined).then(setCommunes);
    setCommune("");
  }, [subregion]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getCrus({
        q:         q || undefined,
        type:      type || undefined,
        subregion: subregion || undefined,
        commune:   commune || undefined,
        tasted:    tastedFilter,
        limit:     PAGE_SIZE,
        offset:    page * PAGE_SIZE,
      })
      .then(({ items, total }) => {
        setCrus(items);
        setTotal(total);
      })
      .finally(() => setLoading(false));
  }, [q, type, subregion, commune, tastedFilter, page]);

  useEffect(() => { setPage(0); }, [q, type, subregion, commune, tastedFilter]);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = q || type || subregion || commune || tastedFilter !== null;

  function clearFilters() {
    setQ("");
    setType("");
    setSubregion("");
    setCommune("");
    setTastedFilter(null);
  }

  function handleCruCreated(created) {
    setShowAddForm(false);
    navigate(`/cru/${created.id}`);
  }

  return (
    <div className="page">
      {/* Add cru button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        {!showAddForm && (
          <button className="primary" onClick={() => setShowAddForm(true)}>
            + Ny cru
          </button>
        )}
      </div>

      {/* Add cru form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <AddCruForm
            onCreated={handleCruCreated}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="filter-search"
            type="text"
            placeholder="Vilken vinmark ska vi utforska idag?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <span className="filter-group-label">Typ</span>
          <button
            className={`filter-pill${type === "grand" ? " active" : ""}`}
            onClick={() => setType(type === "grand" ? "" : "grand")}
          >
            Grand Cru
          </button>
          <button
            className={`filter-pill${type === "premier" ? " active" : ""}`}
            onClick={() => setType(type === "premier" ? "" : "premier")}
          >
            Premier Cru
          </button>

          <span className="filter-group-label" style={{ marginLeft: "0.5rem" }}>Provad</span>
          <button
            className={`filter-pill${tastedFilter === true ? " active" : ""}`}
            onClick={() => setTastedFilter(tastedFilter === true ? null : true)}
          >
            Provad
          </button>
          <button
            className={`filter-pill${tastedFilter === false ? " active" : ""}`}
            onClick={() => setTastedFilter(tastedFilter === false ? null : false)}
          >
            Ej provad
          </button>

          <span className="filter-count">
            {loading ? "…" : `${total.toLocaleString()} crus`}
          </span>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              Rensa filter
            </button>
          )}
        </div>

        {subregions.length > 0 && (
          <div className="filter-row">
            <span className="filter-group-label">Delregion</span>
            {subregions.map((s) => (
              <button
                key={s}
                className={`filter-pill${subregion === s ? " active" : ""}`}
                onClick={() => setSubregion(subregion === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {communes.length > 0 && (
          <div className="filter-row">
            <span className="filter-group-label">Kommun</span>
            {communes.map((c) => (
              <button
                key={c}
                className={`filter-pill${commune === c ? " active-gold" : ""}`}
                onClick={() => setCommune(commune === c ? "" : c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="empty">Laddar…</p>
      ) : crus.length === 0 ? (
        <p className="empty">Inga crus hittades.</p>
      ) : (
        <div className="cru-grid">
          {crus.map((c) => (
            <CruCard
              key={c.id}
              cru={c}
              onClick={() => navigate(`/cru/${c.id}`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Föregående
          </button>
          <span className="muted">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Nästa →
          </button>
        </div>
      )}
    </div>
  );
}
