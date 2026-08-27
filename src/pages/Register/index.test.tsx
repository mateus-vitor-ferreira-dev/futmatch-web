/**
 * Fluxo crítico: entrar na conta.
 *
 * A porta de entrada do produto. Duas coisas precisam funcionar sempre: dizer
 * ao usuário o que ele errou, e mandá-lo para o painel certo. Redirecionar um
 * dono de quadra para a home de jogador é dar a ele um app que não serve para
 * o que ele veio fazer.
 *
 * Diferente do CriarPartida, o formulário aqui tem `noValidate` — quem valida é
 * o yup, e as mensagens do time são de fato as que aparecem na tela.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within, fireEvent } from '../../test/render'
import { criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { SESSION_HINT_KEY } from '../../services/api'
import Register from './index'

const { navega } = vi.hoisted(() => ({ navega: vi.fn() }))

vi.mock('react-router-dom', async (original) => ({
  ...(await original<typeof import('react-router-dom')>()),
  useNavigate: () => navega,
}))
vi.mock('../../services/auth')
vi.mock('../../services/sports')

// O client id vem do `.env`, que não existe no CI: sem este mock o botão do
// Google cairia no caminho "não configurado" lá, e o teste passaria verde sem
// ter exercitado nada.
vi.mock('../../config/env', async (original) => ({
  env: {
    ...(await original<typeof import('../../config/env')>()).env,
    googleClientId: 'client-de-teste.apps.googleusercontent.com',
  },
}))

import * as authService from '../../services/auth'
import { getSports } from '../../services/sports'

const login = vi.mocked(authService.login)
const cadastro = vi.mocked(authService.register)
const getMe = vi.mocked(authService.getMe)
const googleAuth = vi.mocked(authService.googleAuth)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSports).mockRejectedValue(erroDaApi('sem sports', 503))
  // O AuthContext busca o perfil completo depois de autenticar — o payload do
  // login traz só os campos públicos da conta. Sem esta resposta, todo login
  // destes testes falharia no passo seguinte ao acerto da senha.
  getMe.mockResolvedValue(envelope(criaUsuario()))
})

describe('Cadastro — documentos legais', () => {
  it('abre os documentos publicados na landing em uma nova aba', () => {
    renderWithProviders(<Register initialMode="register" />, { route: '/register' })

    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toMatchObject({
      href: 'https://so-mais-um.com/termos-de-uso',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toMatchObject({
      href: 'https://so-mais-um.com/politica-de-privacidade',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  })
})

describe('Cadastro — consentimento de marketing', () => {
  it('começa desmarcado e envia false sem bloquear o cadastro', async () => {
    cadastro.mockResolvedValue(envelope({ token: 't', user: criaUsuario() }))
    const { user } = renderWithProviders(<Register initialMode="register" />, { route: '/register' })

    const optIn = screen.getByRole('checkbox', { name: /quero receber novidades/i })
    expect(optIn).not.toBeChecked()

    await user.type(screen.getByPlaceholderText('Ex: João da Silva'), 'João Silva')
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'joao@exemplo.com')
    await user.type(screen.getByPlaceholderText('Mín. 6 caracteres'), 'senha123')
    await user.type(screen.getByPlaceholderText('Repita a senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: /criar conta grátis/i }))

    await waitFor(() => expect(cadastro).toHaveBeenCalledWith(expect.objectContaining({ marketingOptIn: false })))
  })

  it('envia true somente depois da escolha explícita', async () => {
    cadastro.mockResolvedValue(envelope({ token: 't', user: criaUsuario() }))
    const { user } = renderWithProviders(<Register initialMode="register" />, { route: '/register' })

    await user.type(screen.getByPlaceholderText('Ex: João da Silva'), 'João Silva')
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'joao2@exemplo.com')
    await user.type(screen.getByPlaceholderText('Mín. 6 caracteres'), 'senha123')
    await user.type(screen.getByPlaceholderText('Repita a senha'), 'senha123')
    await user.click(screen.getByRole('checkbox', { name: /quero receber novidades/i }))
    await user.click(screen.getByRole('button', { name: /criar conta grátis/i }))

    await waitFor(() => expect(cadastro).toHaveBeenCalledWith(expect.objectContaining({ marketingOptIn: true })))
  })
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
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
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
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
  })
})

/**
 * O retorno para onde a pessoa estava indo — #302.
 *
 * Quem chega por um link de convite passa por esta tela no meio do caminho. Sem
 * o `next`, o cadastro a joga na home — o vazamento que a #229 descreveu:
 * *"a pessoa clica no convite, é obrigada a se cadastrar, e o cadastro a joga
 * na home sem nenhuma relação com o que ela veio fazer"*.
 */
describe('Login — voltar para onde a pessoa estava indo', () => {
  function abreLoginCom(next: string) {
    const rota = `/login?next=${encodeURIComponent(next)}`
    const resultado = renderWithProviders(<Register initialMode="login" />, { route: rota })
    const formulario = resultado.container.querySelector('form')!
    return {
      ...resultado,
      email: screen.getByPlaceholderText('seu@email.com'),
      senha: screen.getByPlaceholderText('Sua senha'),
      entrar: within(formulario).getByRole('button', { name: 'Entrar' }),
    }
  }

  async function entra(campos: ReturnType<typeof abreLoginCom>) {
    await campos.user.type(campos.email, 'mateus@exemplo.com')
    await campos.user.type(campos.senha, 'segredo123')
    await campos.user.click(campos.entrar)
  }

  beforeEach(() => {
    login.mockResolvedValue(
      envelope({ token: 'token-novo', user: criaUsuario({ role: 'PLAYER' }) }),
    )
  })

  it('volta para a partida, com o convite dentro', async () => {
    const destino = '/partida/partida-1?convite=token-abc'
    const campos = abreLoginCom(destino)

    await entra(campos)

    // O `replace` é de propósito: o login não fica no histórico, senão o botão
    // "voltar" do navegador devolve a pessoa para uma tela de login que ela já
    // passou — e o `PublicRoute` a manda de volta na hora.
    await waitFor(() => expect(navega).toHaveBeenCalledWith(destino, { replace: true }))
  })

  it('sem next, o destino continua sendo o do papel', async () => {
    const campos = abreLogin()

    await entra(campos)

    await waitFor(() => expect(navega).toHaveBeenCalledWith('/home'))
  })

  it.each([
    ['//site-de-fora.com',          'URL absoluta disfarçada de caminho'],
    ['https://site-de-fora.com',    'URL absoluta declarada'],
    ['javascript:alert(1)',         'esquema executável'],
  ])('ignora %s — %s', async (destinoMalicioso) => {
    const campos = abreLoginCom(destinoMalicioso)

    await entra(campos)

    // **A tela de login não pode virar redirecionador aberto.** Um `next` que
    // aponta para fora transformaria um link do próprio domínio numa ponte para
    // phishing: a vítima confere o domínio, confia, e sai em outro lugar.
    await waitFor(() => expect(navega).toHaveBeenCalledWith('/home'))
    expect(navega).not.toHaveBeenCalledWith(destinoMalicioso, expect.anything())
  })
})

/**
 * Login com Google — a outra porta de entrada.
 *
 * A #318 tirou o script do Google Identity Services do carregamento inicial:
 * ele passou a descer só depois de um sinal de intenção sobre o botão. O que
 * estes testes guardam é que o adiamento não custou a porta — e que, quando o
 * script não desce, a pessoa não fica presa.
 *
 * O jsdom insere a tag do script mas não busca nada, então o teste faz o papel
 * do browser: publica o `window.google` e dispara o `load` da tag.
 */
describe('Login — com o Google', () => {
  const scriptDoGis = () => document.querySelector('script[src^="https://accounts.google.com/gsi/client"]')

  interface JanelaComGoogle extends Window {
    google?: unknown
  }

  afterEach(() => {
    delete (window as JanelaComGoogle).google
  })

  /** Faz o script "chegar", devolvendo o access_token que o Google devolveria. */
  function scriptChega(accessToken = 'token-do-google') {
    const tag = scriptDoGis()
    if (!tag) throw new Error('o script do GIS nem foi pedido')
    ;(window as JanelaComGoogle).google = {
      accounts: {
        oauth2: {
          initTokenClient: ({ callback }: { callback: (r: unknown) => void }) => ({
            requestAccessToken: () => callback({ access_token: accessToken }),
          }),
        },
      },
    }
    fireEvent.load(tag)
  }

  it('a tela abre sem pedir o script do Google', () => {
    renderWithProviders(<Register initialMode="login" />, { route: '/login' })

    expect(screen.getByRole('button', { name: /Fazer Login com o Google/ })).toBeInTheDocument()
    expect(scriptDoGis()).toBeNull()
  })

  it('manda o token do Google para a API e leva ao painel do papel', async () => {
    googleAuth.mockResolvedValue(envelope({ user: criaUsuario({ role: 'OWNER' }), token: 't' }))
    getMe.mockResolvedValue(envelope(criaUsuario({ role: 'OWNER' })))

    renderWithProviders(<Register initialMode="login" />, { route: '/login' })

    fireEvent.pointerEnter(screen.getByRole('button', { name: /Fazer Login com o Google/ }))
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    scriptChega()

    fireEvent.click(await screen.findByRole('button', { name: /Fazer Login com o Google/ }))

    await waitFor(() => expect(googleAuth).toHaveBeenCalledWith('token-do-google'))
    await waitFor(() => expect(navega).toHaveBeenCalledWith('/owner'))
  })

  it('na aba de cadastro, o mesmo botão cria a conta', async () => {
    googleAuth.mockResolvedValue(envelope({ user: criaUsuario({ role: 'PLAYER' }), token: 't' }))

    renderWithProviders(<Register initialMode="register" />, { route: '/register' })

    const botao = screen.getByRole('button', { name: /Cadastrar com o Google/ })
    fireEvent.pointerEnter(botao)
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    scriptChega('token-do-cadastro')

    fireEvent.click(await screen.findByRole('button', { name: /Cadastrar com o Google/ }))

    await waitFor(() => expect(googleAuth).toHaveBeenCalledWith('token-do-cadastro'))
  })

  it('mostra na tela quando a API recusa o token', async () => {
    googleAuth.mockRejectedValue(erroDaApi('token inválido', 401))

    renderWithProviders(<Register initialMode="login" />, { route: '/login' })

    fireEvent.pointerEnter(screen.getByRole('button', { name: /Fazer Login com o Google/ }))
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    scriptChega()

    fireEvent.click(await screen.findByRole('button', { name: /Fazer Login com o Google/ }))

    expect(await screen.findByText('Erro ao entrar com Google.')).toBeInTheDocument()
  })

  /**
   * O caso que a #318 pediu por escrito: bloqueador de script, CSP ou rede
   * caída não podem trancar a porta. Antes, o botão continuava clicável e não
   * fazia nada — `useGoogleLogin` chama `clientRef.current?.…`, e sem script o
   * `clientRef` é vazio.
   */
  it('script bloqueado não impede o login por e-mail', async () => {
    login.mockResolvedValue(envelope({ user: criaUsuario({ role: 'PLAYER' }), token: 't' }))

    const { user } = renderWithProviders(<Register initialMode="login" />, { route: '/login' })

    fireEvent.pointerEnter(screen.getByRole('button', { name: /Fazer Login com o Google/ }))
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    fireEvent.error(scriptDoGis() as Element)

    expect(await screen.findByRole('button', { name: /Google indisponível — use seu e-mail/ })).toBeDisabled()

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'jogador@so-mais-um.com')
    await user.type(screen.getByPlaceholderText('Sua senha'), 'senha-secreta')
    await user.click(within(document.querySelector('form') as HTMLElement).getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: 'jogador@so-mais-um.com',
      password: 'senha-secreta',
    }))
    await waitFor(() => expect(navega).toHaveBeenCalledWith('/home'))
  })
})
