import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import type {
  LoginInput,
  RegisterInput,
  RegisterOwnerInput,
} from '../services/auth'
import { TOKEN_KEY } from '../services/api'
import type { ApiEnvelope, AuthResult, UserMe } from '../types/api'

export interface AuthContextValue {
  user: UserMe | null
  loading: boolean
  isAuthenticated: boolean
  register: (data: RegisterInput) => Promise<ApiEnvelope<AuthResult>>
  registerOwner: (data: RegisterOwnerInput) => Promise<ApiEnvelope<AuthResult>>
  login: (data: LoginInput) => Promise<ApiEnvelope<AuthResult>>
  googleLogin: (idToken: string) => Promise<ApiEnvelope<AuthResult>>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provedor de autenticação da aplicação.
 *
 * Restaura a sessão ao montar (via token no localStorage),
 * e expõe ações de registro, login, Google OAuth e logout.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  // Restaura sessão ao montar: verifica token salvo e busca dados do usuário
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }

    authService.getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  /**
   * Persiste o JWT no localStorage.
   *
   * A chave vem de services/api: era o literal 'só+1:token' repetido aqui em
   * três pontos e mais uma vez no interceptor. Uma divergência de digitação
   * entre eles quebraria a sessão sem erro visível.
   */
  const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)

  /**
   * Fecha a autenticação: guarda o token e popula o usuário pelo GET /auth/me.
   *
   * O payload de login traz só os campos públicos da conta (`UserSessao`), sem
   * o `pixKey` que o formulário de perfil precisa. Buscar o perfil aqui deixa
   * uma forma só de `user` no app — a mesma que a restauração de sessão ali em
   * cima já usa. Custa uma requisição a mais num evento que acontece uma vez
   * por sessão, e em troca não existe mais um `user` pela metade circulando.
   */
  const concluirAutenticacao = useCallback(async (token: string) => {
    saveToken(token)

    try {
      const me = await authService.getMe()
      setUser(me.data)
    } catch (err) {
      // Sem o perfil não há sessão utilizável. Falhar visível, e deixar a
      // pessoa tentar de novo, é melhor do que ficar autenticado pela metade.
      localStorage.removeItem(TOKEN_KEY)
      throw err
    }
  }, [])

  const register = useCallback(async (data: RegisterInput) => {
    const res = await authService.register(data)
    await concluirAutenticacao(res.data.token)
    return res
  }, [concluirAutenticacao])

  const registerOwner = useCallback(async (data: RegisterOwnerInput) => {
    const res = await authService.registerOwner(data)
    await concluirAutenticacao(res.data.token)
    return res
  }, [concluirAutenticacao])

  const login = useCallback(async (data: LoginInput) => {
    const res = await authService.login(data)
    await concluirAutenticacao(res.data.token)
    return res
  }, [concluirAutenticacao])

  /** `idToken` é o credential retornado pelo componente GoogleLogin. */
  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleAuth(idToken)
    await concluirAutenticacao(res.data.token)
    return res
  }, [concluirAutenticacao])

  /** Recarrega os dados do usuário autenticado (uso após editar perfil) */
  const refreshUser = useCallback(async () => {
    const res = await authService.getMe()
    setUser(res.data)
  }, [])

  /** Remove o token e limpa o estado do usuário */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      register,
      registerOwner,
      login,
      googleLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir o contexto de autenticação.
 * Deve ser usado dentro de um `AuthProvider`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
