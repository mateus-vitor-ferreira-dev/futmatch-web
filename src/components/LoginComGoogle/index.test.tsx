/**
 * O botão do Google e o momento em que o script do GIS desce.
 *
 * Por que este arquivo existe
 * ---------------------------
 * A linha de base da #226 mediu 96,30 KiB de `accounts.google.com/gsi/client`
 * na primeira tela, com 80,72 KiB apontados como não usados — o maior item
 * isolado da lista. A #318 tirou esse download do caminho crítico, e o que
 * garante que ele não volte é o primeiro teste daqui: **antes de qualquer
 * sinal de intenção, o script não existe no documento**.
 *
 * Os outros garantem o que o adiamento não pode custar: o login e o cadastro
 * com Google continuam funcionando, e script bloqueado não deixa a pessoa sem
 * saída — que era o comportamento antigo, com o botão clicável e mudo.
 *
 * Como o script é simulado
 * ------------------------
 * O jsdom insere a tag mas não busca nada. Então o teste faz os dois lados que
 * o browser faria: publica o `window.google` que o GIS publicaria, e dispara o
 * `load` da tag. É o mesmo contrato que o `@react-oauth/google` consome — ele
 * lê `window.google.accounts.oauth2.initTokenClient` dentro do `onload`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/render'
import LoginComGoogle from './index'

// O client id vem do `.env`, que não existe no CI: sem este mock o componente
// cairia no caminho "não configurado" lá e passaria verde sem testar nada.
vi.mock('../../config/env', async (original) => ({
  env: {
    ...(await original<typeof import('../../config/env')>()).env,
    googleClientId: 'client-de-teste.apps.googleusercontent.com',
  },
}))

const SELETOR_DO_SCRIPT = 'script[src^="https://accounts.google.com/gsi/client"]'
const scriptDoGis = () => document.querySelector(SELETOR_DO_SCRIPT)

interface JanelaComGoogle extends Window {
  google?: unknown
}

/** Publica o `window.google` e avisa a tag que o download terminou. */
function scriptChega(requestAccessToken = vi.fn()) {
  const tag = scriptDoGis()
  if (!tag) throw new Error('o script do GIS nem foi pedido')

  ;(window as JanelaComGoogle).google = {
    accounts: {
      oauth2: {
        initTokenClient: vi.fn(() => ({ requestAccessToken })),
      },
    },
  }
  fireEvent.load(tag)
  return requestAccessToken
}

/** Avisa a tag que o download falhou — bloqueador, rede, CSP. */
function scriptFalha() {
  const tag = scriptDoGis()
  if (!tag) throw new Error('o script do GIS nem foi pedido')
  fireEvent.error(tag)
}

const props = {
  rotulo: 'Fazer Login com o Google',
  onSucesso: vi.fn(),
  onErro: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  delete (window as JanelaComGoogle).google
})

describe('quando o script do Google desce', () => {
  it('não desce só por a tela ter aparecido', () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    expect(screen.getByRole('button', { name: /Fazer Login com o Google/ })).toBeInTheDocument()
    expect(scriptDoGis()).toBeNull()
  })

  it('desce quando o mouse passa pelo botão', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.pointerEnter(screen.getByRole('button'))

    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
  })

  it('desce quando o botão recebe o foco — quem chega pelo teclado não passa o mouse', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.focus(screen.getByRole('button'))

    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
  })

  /**
   * `pointerdown` chega antes do `click`. No toque, é a única janela que
   * existe entre "a pessoa decidiu" e "o browser precisa do popup".
   */
  it('desce no toque, antes de o clique acontecer', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.pointerDown(screen.getByRole('button'))

    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
  })

  it('é pedido uma vez só, por mais que o mouse vá e volte', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)
    const botao = screen.getByRole('button')

    fireEvent.pointerEnter(botao)
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    fireEvent.pointerEnter(botao)
    fireEvent.focus(botao)
    fireEvent.pointerDown(botao)

    expect(document.querySelectorAll(SELETOR_DO_SCRIPT)).toHaveLength(1)
  })
})

/**
 * O bug que os testes antigos não pegavam.
 *
 * A primeira versão trocava o botão inerte por um `<GoogleOAuthProvider>` com
 * o botão dentro. Em jsdom isso passava: `getByRole('button')` continua achando
 * *um* botão. Em browser de verdade, o React desmonta o nó antigo e monta
 * outro — e aí o `click` do toque cai num elemento que já saiu do DOM, e o
 * foco do teclado vai para o `body`.
 *
 * Estes dois testes olham a identidade do nó, não a existência dele. Foram
 * escritos depois de ver o problema no Chromium, e reprovam a versão antiga.
 */
describe('o botão sobrevive ao despertar', () => {
  it('é o mesmo nó do DOM antes e depois — senão o toque perde o clique', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)
    const antes = screen.getByRole('button')

    fireEvent.pointerDown(antes)
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())

    expect(screen.getByRole('button')).toBe(antes)
  })

  it('não perde o foco de quem chegou pelo teclado', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)
    const botao = screen.getByRole('button')

    botao.focus()
    fireEvent.focus(botao)
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())

    expect(document.activeElement).toBe(botao)
  })
})

describe('entrar com o Google', () => {
  it('abre o fluxo do Google no clique, com o script já pronto', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)
    const botao = screen.getByRole('button')

    fireEvent.pointerEnter(botao)
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    const pedeToken = scriptChega()

    fireEvent.click(await screen.findByRole('button', { name: /Fazer Login com o Google/ }))

    expect(pedeToken).toHaveBeenCalledTimes(1)
  })

  it('entrega o access_token a quem chamou', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.pointerEnter(screen.getByRole('button'))
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())

    // O GIS chama o `callback` que recebeu no `initTokenClient`; aqui o teste
    // faz o papel dele, com a resposta que o Google devolveria.
    const inicializa = vi.fn(({ callback }: { callback: (r: unknown) => void }) => ({
      requestAccessToken: () => callback({ access_token: 'token-do-google' }),
    }))
    ;(window as JanelaComGoogle).google = { accounts: { oauth2: { initTokenClient: inicializa } } }
    fireEvent.load(scriptDoGis() as Element)

    fireEvent.click(await screen.findByRole('button', { name: /Fazer Login com o Google/ }))

    await waitFor(() => expect(props.onSucesso).toHaveBeenCalledWith('token-do-google'))
  })

  /**
   * O clique que chega antes do script — teclado, rede ruim. O pedido fica
   * pendente e dispara sozinho, senão o clique sumiria sem deixar rastro.
   */
  it('segura o clique que chegou antes do script e dispara quando ele chega', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.click(screen.getByRole('button'))

    expect(await screen.findByRole('button', { name: /Conectando com o Google/ })).toBeInTheDocument()

    const pedeToken = scriptChega()

    await waitFor(() => expect(pedeToken).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /Fazer Login com o Google/ })).toBeInTheDocument()
  })
})

describe('quando o Google não carrega', () => {
  it('diz que está indisponível e manda a pessoa para o e-mail', async () => {
    renderWithProviders(<LoginComGoogle {...props} />)

    fireEvent.pointerEnter(screen.getByRole('button'))
    await waitFor(() => expect(scriptDoGis()).not.toBeNull())
    scriptFalha()

    const botao = await screen.findByRole('button', { name: /Google indisponível — use seu e-mail/ })
    expect(botao).toBeDisabled()
    expect(props.onErro).toHaveBeenCalledWith('Não foi possível carregar o Google. Entre com seu e-mail.')
  })

  /**
   * Sem client id o botão não teria o que fazer, e baixar o script seria pagar
   * 96 KiB por um popup que nunca abriria.
   */
  it('sem client id configurado, não pede o script nem finge que funciona', async () => {
    vi.resetModules()
    vi.doMock('../../config/env', () => ({ env: { googleClientId: '' } }))
    const { default: SemClientId } = await import('./index')

    renderWithProviders(<SemClientId {...props} />)

    expect(screen.getByRole('button', { name: /Fazer Login com o Google/ })).toBeDisabled()
    expect(scriptDoGis()).toBeNull()

    vi.doUnmock('../../config/env')
    vi.resetModules()
  })
})
