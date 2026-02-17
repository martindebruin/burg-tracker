import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api";
import { RatingDisplay } from "../components/RatingWidget";

const CENTER = [47.05, 4.87];
const ZOOM = 10;

// Marker style by type + tasted status
function markerOptions(cru) {
  const isGrand = cru.type === "grand";
  const color = isGrand ? "#6b1d2a" : "#c8a96e";
  return {
    radius: isGrand ? 8 : 5,
    fillColor: color,
    color: isGrand ? "#4a1220" : "#b39055",
    weight: 2,
    opacity: 1,
    fillOpacity: cru.tasted ? 0.9 : 0.25,
  };
}

export function MapPage() {
  const [crus, setCrus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(""); // "" | "grand" | "premier"
  const [tastedFilter, setTastedFilter] = useState(null); // null | true | false

  useEffect(() => {
    api.getCrus({ limit: 500 }).then(({ items }) => {
      setCrus(items);
      setLoading(false);
    });
  }, []);

  const visible = crus.filter((c) => {
    if (c.latitude == null || c.longitude == null) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (tastedFilter === true && !c.tasted) return false;
    if (tastedFilter === false && c.tasted) return false;
    return true;
  });

  return (
    <div className="map-page">
      <div className="map-controls">
        <span className="filter-group-label">Typ</span>
        <button
          className={`filter-pill${typeFilter === "" ? " active" : ""}`}
          onClick={() => setTypeFilter("")}
        >Alla</button>
        <button
          className={`filter-pill${typeFilter === "grand" ? " active" : ""}`}
          onClick={() => setTypeFilter(typeFilter === "grand" ? "" : "grand")}
        >Grand Cru</button>
        <button
          className={`filter-pill${typeFilter === "premier" ? " active" : ""}`}
          onClick={() => setTypeFilter(typeFilter === "premier" ? "" : "premier")}
        >Premier Cru</button>

        <span className="filter-group-label" style={{ marginLeft: "0.75rem" }}>Provad</span>
        <button
          className={`filter-pill${tastedFilter === null ? " active" : ""}`}
          onClick={() => setTastedFilter(null)}
        >Alla</button>
        <button
          className={`filter-pill${tastedFilter === true ? " active" : ""}`}
          onClick={() => setTastedFilter(tastedFilter === true ? null : true)}
        >Provad</button>
        <button
          className={`filter-pill${tastedFilter === false ? " active" : ""}`}
          onClick={() => setTastedFilter(tastedFilter === false ? null : false)}
        >Ej provad</button>

        <span className="filter-count" style={{ marginLeft: "auto" }}>
          {loading ? "…" : `${visible.length} nålar`}
        </span>

        <div style={{ marginLeft: "0.5rem", display: "flex", gap: "1rem", fontSize: "0.78rem", fontFamily: "sans-serif", color: "var(--muted)" }}>
          <span>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#6b1d2a", marginRight: 4 }} />
            Grand Cru
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#c8a96e", marginRight: 4 }} />
            Premier Cru
          </span>
          <span style={{ color: "var(--muted)" }}>Fylld = provad</span>
        </div>
      </div>

      {loading ? (
        <p className="empty">Laddar karta…</p>
      ) : (
        <div className="map-container">
          <MapContainer
            center={CENTER}
            zoom={ZOOM}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {visible.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                {...markerOptions(c)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                      <Link to={`/cru/${c.id}`}>{c.name}</Link>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#8a7a72" }}>
                      <span className={`badge badge-${c.type}`} style={{ marginRight: 4 }}>
                        {c.type === "grand" ? "Grand Cru" : "1er Cru"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                      {c.commune} · {c.subregion}
                    </div>
                    {c.tasted ? (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge badge-tasted">Provad</span>
                        {c.best_rating !== null && c.best_rating !== undefined && (
                          <span style={{ marginLeft: 6 }}>
                            <RatingDisplay value={c.best_rating} />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", color: "#8a7a72", marginTop: 4, fontStyle: "italic" }}>
                        Ej provad ännu
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
