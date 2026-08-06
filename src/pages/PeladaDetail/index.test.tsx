/**
 * Fluxo crítico: entrar numa pelada.
 *
 * É o momento em que o jogador vira participante — o que o produto existe para
 * fazer. Erro aqui aparece de dois jeitos, e os dois são caros: deixar entrar
 * numa pelada lotada (alguém chega e não tem vaga) ou bloquear quem podia
 * entrar (a pelada não enche).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaPelada, criaParticipante, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { TOKEN_KEY } from '../../services/api'
import PeladaDetail from './index'

vi.mock('../../services/playerService')
vi.mock('../../services/auth')
vi.mock('../../services/notificationService')
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

import { playerService } from '../../services/playerService'
import * as authService from '../../services/auth'
import { notificationService } from '../../services/notificationService'
import { toast } from 'sonner'

const buscaPelada = vi.mocked(playerService.getEvent)
const entraNaPelada = vi.mocked(playerService.joinEvent)

const USUARIO = criaUsuario({ id: 'user-1', name: 'Mateus' })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem(TOKEN_KEY, 'token-valido')
  vi.mocked(authService.getMe).mockResolvedValue(envelope(USUARIO))
  vi.mocked(notificationService.list).mockResolvedValue([])
  entraNaPelada.mockResolvedValue(envelope({ userId: 'user-1' } as never))
})

/** Renderiza já na rota da pelada, com o padrão que alimenta o useParams. */
function abrePelada() {
  return renderWithProviders(<PeladaDetail />, {
    route: '/pelada/pelada-1',
    path: '/pelada/:eventId',
  })
}

describe('PeladaDetail — contagem de vagas', () => {
  it('mostra confirmados, total e vagas restantes', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 6 } })),
    )

    abrePelada()

    expect(await screen.findByText('6 / 10 confirmados')).toBeInTheDocument()
    expect(screen.getByText('4 vagas')).toBeInTheDocument()
  })

  it('usa o singular quando resta uma vaga só', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 9 } })),
    )

    abrePelada()

    expect(await screen.findByText('1 vaga')).toBeInTheDocument()
  })

  it('anuncia "Lotado" em vez de contar vagas quando enche', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 10 } })),
    )

    abrePelada()

    expect(await screen.findByText('Lotado')).toBeInTheDocument()
    expect(screen.queryByText('0 vagas')).not.toBeInTheDocument()
  })

  it('busca a pelada pelo id que veio da URL', async () => {
    buscaPelada.mockResolvedValue(envelope(criaPelada()))

    abrePelada()

    await waitFor(() => expect(buscaPelada).toHaveBeenCalledWith('pelada-1'))
  })
})

describe('PeladaDetail — botão de entrar', () => {
  it('deixa entrar quando há vaga e o usuário está de fora', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePelada()

    const botao = await screen.findByRole('button', { name: /entrar na pelada/i })
    expect(botao).toBeEnabled()
  })

  it('bloqueia o botão quando a pelada está lotada', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 4, _count: { participations: 4 } })),
    )

    abrePelada()

    const botao = await screen.findByRole('button', { name: 'Jogo lotado' })
    expect(botao).toBeDisabled()
  })

  it('bloqueia e confirma quando o usuário já está dentro', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({
        maxPlayers: 10,
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePelada()

    const botao = await screen.findByRole('button', { name: /você está confirmado/i })
    expect(botao).toBeDisabled()
  })

  it('some com o botão para o organizador, que já está na pelada', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({
        organizerId: 'user-1',
        organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
      })),
    )

    abrePelada()

    expect(await screen.findByText(/você é o organizador desta pelada/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na pelada/i })).not.toBeInTheDocument()
  })

  it('some com o botão em pelada cancelada', async () => {
    buscaPelada.mockResolvedValue(envelope(criaPelada({ status: 'CANCELLED' })))

    abrePelada()

    expect(await screen.findByText(/cancelado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na pelada/i })).not.toBeInTheDocument()
  })
})

describe('PeladaDetail — ação de entrar', () => {
  it('entrar chama a API e a contagem de vagas sobe na tela', async () => {
    buscaPelada
      .mockResolvedValueOnce(envelope(criaPelada({ maxPlayers: 10, _count: { participations: 3 } })))
      .mockResolvedValue(envelope(criaPelada({
        maxPlayers: 10,
        participations: [criaParticipante({ userId: 'user-1' })],
        _count: { participations: 4 },
      })))

    const { user } = abrePelada()
    expect(await screen.findByText('3 / 10 confirmados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /entrar na pelada/i }))

    expect(entraNaPelada).toHaveBeenCalledWith('quadra-1', 'pelada-1')
    // A tela só reflete a entrada porque recarrega a pelada depois do POST.
    expect(await screen.findByText('4 / 10 confirmados')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /você está confirmado/i })).toBeDisabled()
  })

  it('mostra a mensagem da API quando entrar falha', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 3 } })),
    )
    entraNaPelada.mockRejectedValue(erroDaApi('Você já está em outra pelada neste horário'))

    const { user } = abrePelada()
    await screen.findByRole('button', { name: /entrar na pelada/i })

    await user.click(screen.getByRole('button', { name: /entrar na pelada/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Você já está em outra pelada neste horário')
    })
  })

  it('a chave Pix só aparece para quem está na pelada', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ pixKey: 'pix@arena.com', maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePelada()
    await screen.findByRole('button', { name: /entrar na pelada/i })

    // De fora, a chave de cobrança não interessa — e não é da conta de quem
    // ainda não se comprometeu com o rateio.
    expect(screen.queryByText('pix@arena.com')).not.toBeInTheDocument()
  })

  it('a chave Pix aparece depois de entrar', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({
        pixKey: 'pix@arena.com',
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePelada()

    expect(await screen.findByText('pix@arena.com')).toBeInTheDocument()
  })
})
