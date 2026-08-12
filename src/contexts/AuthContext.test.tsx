/**
 * Fluxo crítico: login e sessão.
 *
 * É a base de tudo — sessão que não restaura joga o usuário para a tela de
 * login a cada F5, e sessão que não limpa deixa um usuário deslogado achando
 * que continua dentro.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../test/render'
import { criaUsuario, envelope, erroDaApi } from '../test/factories'
import { useAuth } from './AuthContext'
import { SESSION_HINT_KEY, marcarSessao } from '../services/api'

vi.mock('../services/auth')
import * as authService from '../services/auth'

const getMe = vi.mocked(authService.getMe)
const login = vi.mocked(authService.login)
const logoutApi = vi.mocked(authService.logout)

/**
 * Sonda: expõe o contexto como texto na tela, para o teste afirmar pelo que
 * está renderizado em vez de espiar o estado interno do provider.
 */
function Sonda() {
  const { user, loading, isAuthenticated, login, logout } = useAuth()
  return (
    <div>
      <p>carregando: {String(loading)}</p>
      <p>autenticado: {String(isAuthenticated)}</p>
      <p>usuário: {user?.name ?? 'nenhum'}</p>
      {/* O .catch existe porque um dos testes faz o login falhar de propósito,
          e a rejeição solta viraria ruído de unhandled rejection. */}
      <button onClick={() => { void login({ email: 'a@b.com', password: '123456' }).catch(() => {}) }}>
        entrar
      </button>
      <button onClick={logout}>sair</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  logoutApi.mockResolvedValue(undefined)
})

describe('AuthContext — restauração de sessão', () => {
  it('sem sessão, termina o carregamento sem chamar a API', async () => {
    renderWithProviders(<Sonda />)

    await waitFor(() => {
      expect(screen.getByText('carregando: false')).toBeInTheDocument()
    })
    expect(getMe).not.toHaveBeenCalled()
    expect(screen.getByText('autenticado: false')).toBeInTheDocument()
  })

  it('com sessão marcada, restaura o usuário ao montar — o cookie vai sozinho', async () => {
    marcarSessao()
    getMe.mockResolvedValue(envelope(criaUsuario({ name: 'Mateus Ferreira' })))

    renderWithProviders(<Sonda />)

    expect(await screen.findByText('usuário: Mateus Ferreira')).toBeInTheDocument()
    expect(screen.getByText('autenticado: true')).toBeInTheDocument()
    expect(getMe).toHaveBeenCalledTimes(1)
  })

  it('com sessão expirada, esquece a marca e não autentica', async () => {
    marcarSessao()
    getMe.mockRejectedValue(erroDaApi('Token inválido', 401))

    renderWithProviders(<Sonda />)

    await waitFor(() => {
      expect(screen.getByText('carregando: false')).toBeInTheDocument()
    })
    // A marca some: mantê-la faria o app perguntar /auth/me a cada F5 para
    // uma sessão que a API já recusou.
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
    expect(screen.getByText('autenticado: false')).toBeInTheDocument()
  })
})

describe('AuthContext — entrar e sair', () => {
  it('login marca a sessão e popula o usuário pelo GET /auth/me', async () => {
    // Os dois nomes são diferentes de propósito. O payload do login traz só os
    // campos públicos da conta — sem o pixKey que o formulário de perfil lê —
    // então o contexto tem que ficar com o que veio do /auth/me. Enquanto ele
    // se populava pelo payload, o perfil abria com o PIX em branco.
    login.mockResolvedValue(
      envelope({ token: 'token-novo', user: criaUsuario({ name: 'Veio Do Payload' }) }),
    )
    getMe.mockResolvedValue(
      envelope(criaUsuario({ name: 'Mateus Ferreira', pixKey: 'mateus@pix.com' })),
    )

    const { user: usuario } = renderWithProviders(<Sonda />)
    await waitFor(() => expect(screen.getByText('carregando: false')).toBeInTheDocument())

    await usuario.click(screen.getByRole('button', { name: 'entrar' }))

    expect(await screen.findByText('usuário: Mateus Ferreira')).toBeInTheDocument()
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
    expect(screen.getByText('autenticado: true')).toBeInTheDocument()
    expect(getMe).toHaveBeenCalledTimes(1)
  })

  it('se o perfil não carregar depois do login, não deixa sessão pela metade', async () => {
    login.mockResolvedValue(envelope({ token: 'token-novo', user: criaUsuario() }))
    getMe.mockRejectedValue(erroDaApi('Erro interno', 500))

    const { user: usuario } = renderWithProviders(<Sonda />)
    await waitFor(() => expect(screen.getByText('carregando: false')).toBeInTheDocument())

    await usuario.click(screen.getByRole('button', { name: 'entrar' }))

    // Marca guardada e usuário vazio seria o pior dos mundos: a aplicação se
    // acharia deslogada e ainda tentaria restaurar a sessão a cada F5.
    await waitFor(() => expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull())
    expect(screen.getByText('autenticado: false')).toBeInTheDocument()
  })

  it('logout apaga a marca, o usuário e pede à API para expirar o cookie', async () => {
    marcarSessao()
    getMe.mockResolvedValue(envelope(criaUsuario()))

    const { user: usuario } = renderWithProviders(<Sonda />)
    await screen.findByText('autenticado: true')

    await usuario.click(screen.getByRole('button', { name: 'sair' }))

    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
    expect(screen.getByText('autenticado: false')).toBeInTheDocument()
    expect(screen.getByText('usuário: nenhum')).toBeInTheDocument()
    // O cookie é httpOnly: só a API consegue apagá-lo.
    expect(logoutApi).toHaveBeenCalledTimes(1)
  })

  /**
   * Sair não pode depender da rede. O estado local cai primeiro e o pedido à
   * API vai atrás — se ele falhar, o app já está deslogado e o cookie morre
   * sozinho na expiração.
   */
  it('sai mesmo quando a chamada de logout falha', async () => {
    marcarSessao()
    getMe.mockResolvedValue(envelope(criaUsuario()))
    logoutApi.mockRejectedValue(erroDaApi('Sem rede', 500))

    const { user: usuario } = renderWithProviders(<Sonda />)
    await screen.findByText('autenticado: true')

    await usuario.click(screen.getByRole('button', { name: 'sair' }))

    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
    expect(screen.getByText('autenticado: false')).toBeInTheDocument()
  })
})
