import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import type {
  LoginInput,
  RegisterInput,
  RegisterOwnerInput,
} from '../services/auth'
import { marcarSessao, esquecerSessao, temSessao } from '../services/api'
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
 * A sessão vive num cookie `httpOnly` que este código não lê — quem a envia é o
 * navegador, em toda requisição, por causa do `withCredentials` em services/api.
 * Aqui só se guarda a marca de que ela existe, para saber se vale a pena
 * perguntar quem é o usuário ao abrir o app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  // Restaura sessão ao montar: o cookie vai junto, então basta perguntar quem é
  useEffect(() => {
    if (!temSessao()) { setLoading(false); return }

    authService.getMe()
      .then((res) => setUser(res.data))
      .catch(esquecerSessao)
      .finally(() => setLoading(false))
  }, [])

  /**
   * Fecha a autenticação: marca a sessão e popula o usuário pelo GET /auth/me.
   *
   * Não há token para guardar — o cookie já veio na resposta do login. O que se
   * anota é só a marca, e ela existe para o app não sair perguntando `/auth/me`
   * para visitante que nunca entrou.
   *
   * O payload de login traz só os campos públicos da conta (`UserSessao`), sem
   * o `pixKey` que o formulário de perfil precisa. Buscar o perfil aqui deixa
   * uma forma só de `user` no app — a mesma que a restauração de sessão ali em
   * cima já usa. Custa uma requisição a mais num evento que acontece uma vez
   * por sessão, e em troca não existe mais um `user` pela metade circulando.
   */
  const concluirAutenticacao = useCallback(async () => {
    marcarSessao()

    try {
      const me = await authService.getMe()
      setUser(me.data)
    } catch (err) {
      // Sem o perfil não há sessão utilizável. Falhar visível, e deixar a
      // pessoa tentar de novo, é melhor do que ficar autenticado pela metade.
      esquecerSessao()
      throw err
    }
  }, [])

  const register = useCallback(async (data: RegisterInput) => {
    const res = await authService.register(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  const registerOwner = useCallback(async (data: RegisterOwnerInput) => {
    const res = await authService.registerOwner(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  const login = useCallback(async (data: LoginInput) => {
    const res = await authService.login(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  /** `idToken` é o credential retornado pelo componente GoogleLogin. */
  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleAuth(idToken)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  /** Recarrega os dados do usuário autenticado (uso após editar perfil) */
  const refreshUser = useCallback(async () => {
    const res = await authService.getMe()
    setUser(res.data)
  }, [])

  /**
   * Encerra a sessão: estado local primeiro, pedido à API depois.
   *
   * A ordem importa. Quem chama faz `logout(); navigate('/login')` sem esperar,
   * e /login manda usuário autenticado de volta para /home — se o `setUser(null)`
   * ficasse atrás de um await de rede, a pessoa clicaria em sair e voltaria para
   * dentro do app.
   *
   * O cookie é `httpOnly`, então quem o apaga é a API. Se essa chamada falhar —
   * sem rede, por exemplo —, o app já está deslogado e o cookie sobrevive até
   * expirar ou até o próximo login sobrescrevê-lo. É o melhor esforço possível
   * daqui, e não vale segurar a saída por causa dele.
   */
  const logout = useCallback(() => {
    esquecerSessao()
    setUser(null)
    void authService.logout().catch(() => {})
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
