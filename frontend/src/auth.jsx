import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken, clearToken } from './api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const loadUser = useCallback(async () => {
    if (!getToken()) { setReady(true); return }
    try {
      setUser(await api.me())
    } catch {
      clearToken()
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  // If any request 401s, drop the user so routes redirect to login.
  useEffect(() => {
    const onUnauth = () => setUser(null)
    window.addEventListener('crm-unauth', onUnauth)
    return () => window.removeEventListener('crm-unauth', onUnauth)
  }, [])

  const login = async (username, password) => {
    const { access_token } = await api.login(username, password)
    setToken(access_token)
    setUser(await api.me())
  }

  const logout = () => { clearToken(); setUser(null) }

  return (
    <AuthCtx.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
