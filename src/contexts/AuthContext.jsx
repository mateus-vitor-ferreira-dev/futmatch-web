import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('futmatch:token')
    if (!token) { setLoading(false); return }

    authService.getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('futmatch:token'))
      .finally(() => setLoading(false))
  }, [])

  const saveToken = (token) => localStorage.setItem('futmatch:token', token)

  const register = useCallback(async (data) => {
    const res = await authService.register(data)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  const login = useCallback(async (data) => {
    const res = await authService.login(data)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  const googleLogin = useCallback(async (idToken) => {
    const res = await authService.googleAuth(idToken)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('futmatch:token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      register, login, googleLogin, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
