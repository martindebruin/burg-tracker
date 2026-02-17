import { createContext, useState, useEffect, useContext } from 'react'
import { getToken, getUser, setToken, setUser, logout as clearAuth } from '../auth'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      api.getMe()
        .then(user => {
          setUserState(user)
          setUser(user)
        })
        .catch(() => {
          clearAuth()
          setUserState(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { access_token, user } = await api.login(username, password)
    setToken(access_token)
    setUser(user)
    setUserState(user)
  }

  const logout = () => {
    clearAuth()
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
