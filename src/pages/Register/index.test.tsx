/**
 * Fluxo crítico: entrar na conta.
 *
 * A porta de entrada do produto. Duas coisas precisam funcionar sempre: dizer
 * ao usuário o que ele errou, e mandá-lo para o painel certo. Redirecionar um
 * dono de quadra para a home de jogador é dar a ele um app que não serve para
 * o que ele veio fazer.
 *
 * Diferente do CriarPelada, o formulário aqui tem `noValidate` — quem valida é
 * o yup, e as mensagens do time são de fato as que aparecem na tela.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { TOKEN_KEY } from '../../services/api'
import Register from './index'

const { navega } = vi.hoisted(() => ({ navega: vi.fn() }))

vi.mock('react-router-dom', async (original) => ({
  ...(await original<typeof import('react-router-dom')>()),
  useNavigate: () => navega,
}))
vi.mock('../../services/auth')
vi.mock('../../services/sports')

import * as authService from '../../services/auth'
import { getSports } from '../../services/sports'

const login = vi.mocked(authService.login)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSports).mockRejectedValue(erroDaApi('sem sports', 503))
})

/**
 * Renderiza a tela em modo login e devolve os campos.
 *
 * O botão é procurado DENTRO do formulário: existe outro "Entrar" na tela — a
 * aba que alterna login/cadastro — e uma busca solta por papel e nome acha os
 * dois.
 */
function abreLogin() {
  const resultado = renderWithProviders(<Register initialMode="login" />, { route: '/login' })
  const formulario = resultado.container.querySelector('form')!
  return {
    ...resultado,
    email: screen.getByPlaceholderText('seu@email.com'),
    senha: screen.getByPlaceholderText('Sua senha'),
    entrar: within(formulario).getByRole('button', { name: 'Entrar' }),
  }
}

describe('Login — validação', () => {
  it('cobra e-mail e senha quando o formulário vai vazio', async () => {
    const { user, entrar } = abreLogin()

    await user.click(entrar)

    expect(await screen.findAllByText('Obrigatório')).toHaveLength(2)
    expect(login).not.toHaveBeenCalled()
  })

  it('recusa e-mail malformado', async () => {
    const { user, email, senha, entrar } = abreLogin()

    await user.type(email, 'não-é-email')
    await user.type(senha, 'segredo123')
    await user.click(entrar)

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
})

describe('Login — credenciais', () => {
  it('envia e-mail e senha para a API', async () => {
    login.mockResolvedValue(envelope({ token: 't', user: criaUsuario() }))
    const { user, email, senha, entrar } = abreLogin()

    await user.type(email, 'mateus@exemplo.com')
    await user.type(senha, 'segredo123')
    await user.click(entrar)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'mateus@exemplo.com',
        password: 'segredo123',
      })
    })
  })

  it('mostra na tela a mensagem que a API devolveu', async () => {
    login.mockRejectedValue(erroDaApi('E-mail ou senha incorretos', 401))
    const { user, email, senha, entrar } = abreLogin()

    await user.type(email, 'mateus@exemplo.com')
    await user.type(senha, 'senha-errada')
    await user.click(entrar)

    expect(await screen.findByText('E-mail ou senha incorretos')).toBeInTheDocument()
    // Erro de credencial não pode gravar sessão nenhuma.
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(navega).not.toHaveBeenCalled()
  })

  it('cai numa mensagem genérica quando o erro não tem corpo', async () => {
    login.mockRejectedValue(new Error(''))
    const { user, email, senha, entrar } = abreLogin()

    await user.type(email, 'mateus@exemplo.com')
    await user.type(senha, 'segredo123')
    await user.click(entrar)

    expect(await screen.findByText(/algo deu errado/i)).toBeInTheDocument()
  })
})

describe('Login — destino por papel', () => {
  it.each([
    ['PLAYER', '/home'],
    ['OWNER', '/owner'],
    ['ADMIN', '/admin'],
  ] as const)('manda %s para %s', async (papel, destino) => {
    login.mockResolvedValue(
      envelope({ token: 'token-novo', user: criaUsuario({ role: papel }) }),
    )
    const { user, email, senha, entrar } = abreLogin()

    await user.type(email, 'mateus@exemplo.com')
    await user.type(senha, 'segredo123')
    await user.click(entrar)

    await waitFor(() => expect(navega).toHaveBeenCalledWith(destino))
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-novo')
  })
})
