import { getToken, logout } from './auth'

const BASE = import.meta.env.VITE_API_URL || "/api";

async function req(path, options = {}) {
  const token = getToken()
  console.log('[API] Request to:', path, 'Token:', token ? token.substring(0, 20) + '...' : 'NONE')
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });

  // Handle 401 - redirect to login
  if (res.status === 401) {
    logout()
    window.location.href = '/login'
    throw new Error('Authentication required')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  register: (data) => req("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (username, password) => {
    console.log('[API] login attempt for:', username)
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return fetch(`${BASE}/auth/login`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(res => {
      console.log('[API] login response status:', res.status)
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    }).then(data => {
      console.log('[API] login success, got token')
      return data
    })
  },
  getMe: () => req("/auth/me"),

  // Users/Profile
  getUserProfile: (username) => req(`/users/${username}`),
  getTopWines: (username) => req(`/users/${username}/top-wines`),
  updateMyProfile: (data) => req("/users/me", { method: "PUT", body: JSON.stringify(data) }),

  // Reviews
  getReviewsByColor: (color, params = {}) => {
    const qs = new URLSearchParams({ color, ...params }).toString()
    return req(`/reviews/by-color?${qs}`)
  },
  getTopWinesByColor: (color, limit = 10) => {
    const qs = new URLSearchParams({ color, limit }).toString()
    return req(`/reviews/top-wines?${qs}`)
  },

  // Admin
  createUser: (data) => req("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/admin/users${qs ? '?' + qs : ''}`)
  },
  updateUser: (id, data) => req(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id) => req(`/admin/users/${id}`, { method: "DELETE" }),
  resetUserPassword: (id, password) => req(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: password })
  }),

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
  getCommunityNotes: (cruId) => req(`/crus/${cruId}/community`),

  // Notes
  getNotes: (cru_id) => req(`/notes${cru_id ? `?cru_id=${cru_id}` : ""}`),
  createNote: (data) => req("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id, data) => req(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id) => req(`/notes/${id}`, { method: "DELETE" }),

  // Stats
  getStats: () => req("/stats"),
};
