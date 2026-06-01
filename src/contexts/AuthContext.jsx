import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/auth'

const AuthContext = createContext(null)

/**
 * Provedor de autenticação da aplicação.
 *
 * Restaura a sessão ao montar (via token no localStorage),
 * e expõe ações de registro, login, Google OAuth e logout.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaura sessão ao montar: verifica token salvo e busca dados do usuário
  useEffect(() => {
    const token = localStorage.getItem('futmatch:token')
    if (!token) { setLoading(false); return }

    authService.getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('futmatch:token'))
      .finally(() => setLoading(false))
  }, [])

  /** Persiste o JWT no localStorage */
  const saveToken = (token) => localStorage.setItem('futmatch:token', token)

  /**
   * Cria conta com e-mail e senha.
   * @param {{ name: string, email: string, password: string, confirmPassword: string, sports?: string[] }} data
   */
  const register = useCallback(async (data) => {
    const res = await authService.register(data)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  /**
   * Autentica com e-mail e senha.
   * @param {{ email: string, password: string }} data
   */
  const login = useCallback(async (data) => {
    const res = await authService.login(data)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  /**
   * Autentica via Google OAuth.
   * @param {string} idToken — Credential retornado pelo componente GoogleLogin
   */
  const googleLogin = useCallback(async (idToken) => {
    const res = await authService.googleAuth(idToken)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res
  }, [])

  /** Remove o token e limpa o estado do usuário */
  const logout = useCallback(() => {
    localStorage.removeItem('futmatch:token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      register,
      login,
      googleLogin,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir o contexto de autenticação.
 * Deve ser usado dentro de um `AuthProvider`.
 *
 * @returns {{ user: object|null, loading: boolean, isAuthenticated: boolean, register: Function, login: Function, googleLogin: Function, logout: Function }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
