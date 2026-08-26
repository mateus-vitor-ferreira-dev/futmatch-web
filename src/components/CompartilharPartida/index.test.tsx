/**
 * Compartilhar a partida por link — #229.
 *
 * O link só vira produto se chegar no grupo do WhatsApp em um toque. É por isso
 * que o modal não pergunta nada antes de mostrar o link, e é isso que a maior
 * parte destes testes protege.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaPartida, envelope, erroDaApi } from '../../test/factories'
import type { PartidaInvite } from '../../types/api'
import CompartilharPartida from './index'

vi.mock('../../services/invites')
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

import { criarConvite, listarConvites, revogarConvite } from '../../services/invites'
import { toast } from 'sonner'

const cria   = vi.mocked(criarConvite)
const lista  = vi.mocked(listarConvites)
const revoga = vi.mocked(revogarConvite)

const PARTIDA = criaPartida({ id: 'partida-1', courtId: 'quadra-1' })

function convite(over: Partial<PartidaInvite> = {}): PartidaInvite {
  const token = over.token ?? 'token-abc'
  return {
    id: 'convite-1',
    matchId: 'partida-1',
    token,
    expiresAt: null,
    maxUses: null,
    uses: 0,
    revokedAt: null,
    createdAt: '2026-08-20T10:00:00.000Z',
    url: `https://app.so-mais-um.com/partida/partida-1?convite=${token}`,
    remainingUses: null,
    ...over,
  }
}

function abre() {
  return renderWithProviders(<CompartilharPartida partida={PARTIDA} onFechar={vi.fn()} />)
}

/**
 * `navigator.clipboard` e `navigator.share` são **getters** no jsdom, e
 * `Object.assign` estoura neles. `defineProperty` com `configurable` é o que
 * permite trocar a implementação a cada teste.
 */
function fingeNavigator(chave: 'clipboard' | 'share', valor: unknown) {
  Object.defineProperty(navigator, chave, { value: valor, configurable: true, writable: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  lista.mockResolvedValue(envelope([]))
  cria.mockResolvedValue(envelope(convite()))
  fingeNavigator('clipboard', { writeText: vi.fn().mockResolvedValue(undefined) })
  // Sem compartilhamento nativo por padrão: é o caso do desktop, e o teste que
  // quer a folha do sistema liga por conta própria.
  fingeNavigator('share', undefined)
})

describe('CompartilharPartida — o link em um toque', () => {
  it('cria um link sozinho quando a partida ainda não tem nenhum', async () => {
    abre()

    // Nada é perguntado antes: validade e limite existem na API e ficam para
    // quem precisar. Pedi-los de todo mundo cobraria duas decisões de quem só
    // quer chamar os amigos.
    await waitFor(() => expect(cria).toHaveBeenCalledWith('quadra-1', 'partida-1'))
    expect(await screen.findByTestId('link-do-convite')).toHaveTextContent('token-abc')
  })

  it('reaproveita o link que já vale, em vez de criar outro', async () => {
    lista.mockResolvedValue(envelope([convite({ id: 'antigo', token: 'token-velho' })]))

    abre()

    // Dois links para a mesma partida são dois links para revogar depois, e a
    // lista vira lixo.
    expect(await screen.findByTestId('link-do-convite')).toHaveTextContent('token-velho')
    expect(cria).not.toHaveBeenCalled()
  })

  it('cria um novo quando o único que existe não vale mais', async () => {
    lista.mockResolvedValue(envelope([
      convite({ id: 'revogado', token: 'token-morto', revokedAt: '2026-08-20T11:00:00.000Z' }),
    ]))

    abre()

    await waitFor(() => expect(cria).toHaveBeenCalled())
    expect(await screen.findByTestId('link-do-convite')).toHaveTextContent('token-abc')
  })

  it('copia o link para a área de transferência', async () => {
    const { user } = abre()

    await screen.findByTestId('link-do-convite')
    await user.click(screen.getByRole('button', { name: /copiar link/i }))

    // Lido de volta da área de transferência, e não de um espião: o
    // `userEvent.setup()` instala o próprio stub de clipboard e substitui
    // qualquer mock posto antes dele. Ler o valor é o que sobrevive a isso — e
    // é o que de fato interessa.
    expect(await navigator.clipboard.readText()).toBe(
      'https://app.so-mais-um.com/partida/partida-1?convite=token-abc',
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link copiado!'))
  })

  it('avisa, sem sumir com o link, quando o navegador nega a cópia', async () => {
    const { user } = abre()

    await screen.findByTestId('link-do-convite')
    // Depois do `abre()`, que é quem chama o `userEvent.setup()` — antes dele o
    // stub do user-event apagaria esta recusa.
    fingeNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('negado')) })
    await user.click(screen.getByRole('button', { name: /copiar link/i }))

    // O link continua na tela para selecionar à mão — e a mensagem diz isso.
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByTestId('link-do-convite')).toBeInTheDocument()
  })
})

describe('CompartilharPartida — o compartilhamento nativo', () => {
  it('oferece o botão quando o aparelho sabe compartilhar', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    fingeNavigator('share', share)

    const { user } = abre()
    await screen.findByTestId('link-do-convite')
    await user.click(screen.getByRole('button', { name: /^compartilhar$/i }))

    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://app.so-mais-um.com/partida/partida-1?convite=token-abc',
    }))
  })

  it('não oferece o botão onde o navegador não sabe compartilhar', async () => {
    fingeNavigator('share', undefined)

    abre()

    await screen.findByTestId('link-do-convite')
    // Oferecer o que não funciona é pior que não oferecer.
    expect(screen.queryByRole('button', { name: /^compartilhar$/i })).not.toBeInTheDocument()
  })

  it('cancelar o compartilhamento não vira erro na tela', async () => {
    fingeNavigator('share', vi.fn().mockRejectedValue(new Error('AbortError')))

    const { user } = abre()
    await screen.findByTestId('link-do-convite')
    await user.click(screen.getByRole('button', { name: /^compartilhar$/i }))

    // A pessoa desistiu; nada quebrou.
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('CompartilharPartida — ver e revogar os links', () => {
  it('lista os links da partida e diz por que cada um parou de valer', async () => {
    lista.mockResolvedValue(envelope([
      convite({ id: 'a', token: 'a' }),
      convite({ id: 'b', token: 'b', revokedAt: '2026-08-20T11:00:00.000Z' }),
      convite({ id: 'c', token: 'c', expiresAt: '2020-01-01T00:00:00.000Z' }),
      convite({ id: 'd', token: 'd', maxUses: 3, uses: 3, remainingUses: 0 }),
    ]))

    abre()

    expect(await screen.findAllByTestId('item-de-link')).toHaveLength(4)
    // Os três motivos são distinguidos, e não viram um "inválido" genérico: o
    // que a pessoa faz em seguida muda em cada caso.
    expect(screen.getByText('revogado')).toBeInTheDocument()
    expect(screen.getByText('expirado')).toBeInTheDocument()
    expect(screen.getByText('esgotado')).toBeInTheDocument()
    expect(screen.getByText('ativo')).toBeInTheDocument()
  })

  it('só oferece revogar no link que ainda vale', async () => {
    lista.mockResolvedValue(envelope([
      convite({ id: 'a', token: 'a' }),
      convite({ id: 'b', token: 'b', revokedAt: '2026-08-20T11:00:00.000Z' }),
    ]))

    abre()

    await screen.findAllByTestId('item-de-link')
    expect(screen.getAllByRole('button', { name: /revogar/i })).toHaveLength(1)
  })

  it('revogar chama a API e a etiqueta muda na tela', async () => {
    lista.mockResolvedValue(envelope([convite({ id: 'a', token: 'a' })]))
    revoga.mockResolvedValue(envelope(convite({ id: 'a', token: 'a', revokedAt: '2026-08-20T12:00:00.000Z' })))

    const { user } = abre()
    await screen.findAllByTestId('item-de-link')

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    expect(revoga).toHaveBeenCalledWith('quadra-1', 'partida-1', 'a')
    expect(await screen.findByText('revogado')).toBeInTheDocument()
    // A mensagem diz o que revogar NÃO faz — é a promessa que a API mantém.
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('continua na partida'))
  })

  it('avisa quando a preparação do link falha, sem quebrar o modal', async () => {
    lista.mockRejectedValue(erroDaApi('sem permissão', 403))

    abre()

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument()
  })
})
