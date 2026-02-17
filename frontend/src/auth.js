// Token storage
export const getToken = () => {
  const token = localStorage.getItem('auth_token')
  console.log('[AUTH] getToken:', token ? token.substring(0, 20) + '...' : 'NONE')
  return token
}
export const setToken = (token) => {
  console.log('[AUTH] setToken:', token.substring(0, 20) + '...')
  localStorage.setItem('auth_token', token)
}
export const clearToken = () => {
  console.log('[AUTH] clearToken')
  localStorage.removeItem('auth_token')
}

// User storage
export const getUser = () => {
  const stored = localStorage.getItem('auth_user')
  return stored ? JSON.parse(stored) : null
}
export const setUser = (user) => localStorage.setItem('auth_user', JSON.stringify(user))
export const clearUser = () => localStorage.removeItem('auth_user')

// Combined logout
export const logout = () => {
  clearToken()
  clearUser()
}
