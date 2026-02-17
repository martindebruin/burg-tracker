const BASE = import.meta.env.VITE_API_URL || "/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Crus
  getCrus: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return req(`/crus${qs ? "?" + qs : ""}`);
  },
  getCru: (id) => req(`/crus/${id}`),
  createCru: (data) => req("/crus", { method: "POST", body: JSON.stringify(data) }),
  updateCru: (id, data) => req(`/crus/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getSubregions: () => req("/crus/subregions"),
  getCommunes: (subregion) =>
    req(`/crus/communes${subregion ? `?subregion=${encodeURIComponent(subregion)}` : ""}`),

  // Notes
  getNotes: (cru_id) => req(`/notes${cru_id ? `?cru_id=${cru_id}` : ""}`),
  createNote: (data) => req("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id, data) => req(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id) => req(`/notes/${id}`, { method: "DELETE" }),

  // Stats
  getStats: () => req("/stats"),
};
