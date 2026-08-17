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
import { marcarSessao } from '../../services/api'
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
const saiDaPelada = vi.mocked(playerService.leaveEvent)

const USUARIO = criaUsuario({ id: 'user-1', name: 'Mateus' })

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(USUARIO))
  vi.mocked(notificationService.list).mockResolvedValue([])
  entraNaPelada.mockResolvedValue(envelope({ userId: 'user-1' } as never))
  saiDaPelada.mockResolvedValue(envelope({ remainingPlayers: 0 } as never))
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

    const botao = await screen.findByRole('button', { name: /entrar na partida/i })
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

    expect(await screen.findByText(/você é o organizador desta partida/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na partida/i })).not.toBeInTheDocument()
  })

  it('some com o botão em pelada cancelada', async () => {
    buscaPelada.mockResolvedValue(envelope(criaPelada({ status: 'CANCELLED' })))

    abrePelada()

    expect(await screen.findByText(/cancelado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na partida/i })).not.toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: /entrar na partida/i }))

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
    await screen.findByRole('button', { name: /entrar na partida/i })

    await user.click(screen.getByRole('button', { name: /entrar na partida/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Você já está em outra pelada neste horário')
    })
  })

  it('a chave Pix só aparece para quem está na pelada', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ pixKey: 'pix@arena.com', maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePelada()
    await screen.findByRole('button', { name: /entrar na partida/i })

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

describe('PeladaDetail — sair da pelada', () => {
  /** Pelada com o usuário confirmado, que é quando o botão de sair existe. */
  function peladaComOUsuarioDentro(over = {}) {
    return envelope(criaPelada({
      maxPlayers: 10,
      participations: [criaParticipante({ userId: 'user-1' })],
      _count: { participations: 4 },
      ...over,
    }))
  }

  it('oferece sair para quem está confirmado', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())

    abrePelada()

    expect(await screen.findByRole('button', { name: /sair da partida/i })).toBeEnabled()
  })

  it('não oferece sair para quem está de fora', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({ maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePelada()
    await screen.findByRole('button', { name: /entrar na partida/i })

    expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
  })

  it('não oferece sair para o organizador — para ele existe cancelar', async () => {
    buscaPelada.mockResolvedValue(
      envelope(criaPelada({
        organizerId: 'user-1',
        organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePelada()
    await screen.findByText(/você é o organizador desta partida/i)

    expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it.each(['FINISHED', 'CANCELLED'] as const)(
    'não oferece sair em pelada %s — a API recusaria',
    async (status) => {
      buscaPelada.mockResolvedValue(peladaComOUsuarioDentro({ status }))

      abrePelada()
      await screen.findByText(/\d+ \/ \d+ confirmados/)

      expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
    },
  )

  it('pede confirmação antes de sair — o clique sozinho não chama a API', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Sair desta partida?')).toBeInTheDocument()
    expect(saiDaPelada).not.toHaveBeenCalled()
  })

  it('desistir da confirmação não chama a API', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /continuar na partida/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(saiDaPelada).not.toHaveBeenCalled()
  })

  it('confirmar chama a API e a contagem de vagas cai na tela', async () => {
    buscaPelada
      .mockResolvedValueOnce(peladaComOUsuarioDentro())
      .mockResolvedValue(envelope(criaPelada({
        maxPlayers: 10,
        _count: { participations: 3 },
      })))
    const { user } = abrePelada()
    expect(await screen.findByText('4 / 10 confirmados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPelada).toHaveBeenCalledWith('quadra-1', 'pelada-1', undefined)
    })
    // A vaga liberada tem que aparecer: é o efeito que o jogador foi buscar.
    expect(await screen.findByText('3 / 10 confirmados')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /entrar na partida/i })).toBeEnabled()
  })

  it('envia o motivo quando o jogador escreve um', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.type(screen.getByLabelText(/quer dizer o motivo/i), 'me machuquei no treino')
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPelada).toHaveBeenCalledWith('quadra-1', 'pelada-1', 'me machuquei no treino')
    })
  })

  it('motivo só com espaços não vira corpo da requisição', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.type(screen.getByLabelText(/quer dizer o motivo/i), '   ')
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPelada).toHaveBeenCalledWith('quadra-1', 'pelada-1', undefined)
    })
  })

  it('limita o motivo ao que a API aceita', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    const campo = screen.getByLabelText(/quer dizer o motivo/i)

    // 200 é o limite do leavePeladaSchema no backend. Cortar aqui evita um
    // 422 que o jogador não teria como prever.
    expect(campo).toHaveAttribute('maxLength', '200')
    await user.type(campo, 'motivo')
    expect(screen.getByText('6 / 200')).toBeInTheDocument()
  })

  it('mostra a mensagem da API quando sair falha, e mantém o modal aberto', async () => {
    buscaPelada.mockResolvedValue(peladaComOUsuarioDentro())
    saiDaPelada.mockRejectedValue(erroDaApi('A pelada já foi finalizada', 422))
    const { user } = abrePelada()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('A pelada já foi finalizada')
    })
    // Falhou: o jogador continua dentro, e o modal segue ali para ele tentar
    // de novo em vez de ficar sem saber o que aconteceu.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
