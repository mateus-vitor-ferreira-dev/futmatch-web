/**
 * Fluxo crítico: entrar numa partida.
 *
 * É o momento em que o jogador vira participante — o que o produto existe para
 * fazer. Erro aqui aparece de dois jeitos, e os dois são caros: deixar entrar
 * numa partida lotada (alguém chega e não tem vaga) ou bloquear quem podia
 * entrar (a partida não enche).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, fireEvent, within } from '../../test/render'
import {
  criaJogadorSorteado,
  criaParticipante,
  criaPartida,
  criaSorteio,
  criaUsuario,
  envelope,
  erroDaApi,
} from '../../test/factories'
import { marcarSessao } from '../../services/api'
import PartidaDetail from './index'

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

const buscaPartida = vi.mocked(playerService.getEvent)
const entraNaPartida = vi.mocked(playerService.joinEvent)
const saiDaPartida = vi.mocked(playerService.leaveEvent)
const consultaEntrada = vi.mocked(playerService.checkEntry)

const USUARIO = criaUsuario({ id: 'user-1', name: 'Mateus' })

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(USUARIO))
  vi.mocked(notificationService.list).mockResolvedValue([])
  entraNaPartida.mockResolvedValue(envelope({ userId: 'user-1' } as never))
  // Sem requisito e liberado: é o que a esmagadora maioria das partidas devolve,
  // e mantém todos os testes anteriores descrevendo o mesmo cenário de sempre.
  consultaEntrada.mockResolvedValue(envelope({ allowed: true, failures: [], requirements: [] }))
  saiDaPartida.mockResolvedValue(envelope({ remainingPlayers: 0 } as never))
})

/** Renderiza já na rota da partida, com o padrão que alimenta o useParams. */
function abrePartida() {
  return renderWithProviders(<PartidaDetail />, {
    route: '/partida/partida-1',
    path: '/partida/:eventId',
  })
}

describe('PartidaDetail — contagem de vagas', () => {
  it('mostra confirmados, total e vagas restantes', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 6 } })),
    )

    abrePartida()

    expect(await screen.findByText('6 / 10 confirmados')).toBeInTheDocument()
    expect(screen.getByText('4 vagas')).toBeInTheDocument()
  })

  it('usa o singular quando resta uma vaga só', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 9 } })),
    )

    abrePartida()

    expect(await screen.findByText('1 vaga')).toBeInTheDocument()
  })

  it('anuncia "Lotado" em vez de contar vagas quando enche', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 10 } })),
    )

    abrePartida()

    expect(await screen.findByText('Lotado')).toBeInTheDocument()
    expect(screen.queryByText('0 vagas')).not.toBeInTheDocument()
  })

  it('busca a partida pelo id que veio da URL', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida()))

    abrePartida()

    await waitFor(() => // O segundo argumento é o token do convite, ausente quando não há um na URL.
    expect(buscaPartida).toHaveBeenCalledWith('partida-1', undefined))
  })
})

describe('PartidaDetail — confirmação de presenças', () => {
  it('oferece a ação ao organizador quando a partida terminou', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida({
      status: 'FINISHED',
      organizerId: 'user-1',
      organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
    })))
    vi.mocked(playerService.getEventParticipants).mockResolvedValue(envelope([]))

    const { user } = abrePartida()
    await user.click(await screen.findByRole('button', { name: 'Confirmar Presenças' }))

    expect(await screen.findByRole('dialog', { name: 'Confirmar Presenças' })).toBeInTheDocument()
    expect(playerService.getEventParticipants).toHaveBeenCalledWith('quadra-1', 'partida-1')
  })

  it('não oferece a ação a quem não é o organizador', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida({ status: 'FINISHED' })))

    abrePartida()

    await screen.findByText(/Finalizado/)
    expect(screen.queryByRole('button', { name: 'Confirmar Presenças' })).not.toBeInTheDocument()
  })
})

describe('PartidaDetail — botão de entrar', () => {
  it('deixa entrar quando há vaga e o usuário está de fora', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePartida()

    const botao = await screen.findByRole('button', { name: /entrar na partida/i })
    expect(botao).toBeEnabled()
  })

  it('bloqueia o botão quando a partida está lotada', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 4, _count: { participations: 4 } })),
    )

    abrePartida()

    const botao = await screen.findByRole('button', { name: 'Partida lotada' })
    expect(botao).toBeDisabled()
  })

  it('bloqueia e confirma quando o usuário já está dentro', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({
        maxPlayers: 10,
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePartida()

    const botao = await screen.findByRole('button', { name: /você está confirmado/i })
    expect(botao).toBeDisabled()
  })

  it('some com o botão para o organizador, que já está na partida', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({
        organizerId: 'user-1',
        organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
      })),
    )

    abrePartida()

    expect(await screen.findByText(/você é o organizador desta partida/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na partida/i })).not.toBeInTheDocument()
  })

  it('some com o botão em partida cancelada', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida({ status: 'CANCELLED' })))

    abrePartida()

    expect(await screen.findByText(/cancelado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /entrar na partida/i })).not.toBeInTheDocument()
  })
})

describe('PartidaDetail — ação de entrar', () => {
  it('entrar chama a API e a contagem de vagas sobe na tela', async () => {
    buscaPartida
      .mockResolvedValueOnce(envelope(criaPartida({ maxPlayers: 10, _count: { participations: 3 } })))
      .mockResolvedValue(envelope(criaPartida({
        maxPlayers: 10,
        participations: [criaParticipante({ userId: 'user-1' })],
        _count: { participations: 4 },
      })))

    const { user } = abrePartida()
    expect(await screen.findByText('3 / 10 confirmados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /entrar na partida/i }))

    expect(entraNaPartida).toHaveBeenCalledWith('quadra-1', 'partida-1')
    // A tela só reflete a entrada porque recarrega a partida depois do POST.
    expect(await screen.findByText('4 / 10 confirmados')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /você está confirmado/i })).toBeDisabled()
  })

  it('mostra a mensagem da API quando entrar falha', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 3 } })),
    )
    entraNaPartida.mockRejectedValue(erroDaApi('Você já está em outra partida neste horário'))

    const { user } = abrePartida()
    await screen.findByRole('button', { name: /entrar na partida/i })

    await user.click(screen.getByRole('button', { name: /entrar na partida/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Você já está em outra partida neste horário')
    })
  })

  it('a chave Pix só aparece para quem está na partida', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ pixKey: 'pix@arena.com', maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePartida()
    await screen.findByRole('button', { name: /entrar na partida/i })

    // De fora, a chave de cobrança não interessa — e não é da conta de quem
    // ainda não se comprometeu com o rateio.
    expect(screen.queryByText('pix@arena.com')).not.toBeInTheDocument()
  })

  it('a chave Pix aparece depois de entrar', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({
        pixKey: 'pix@arena.com',
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePartida()

    expect(await screen.findByText('pix@arena.com')).toBeInTheDocument()
  })
})

describe('PartidaDetail — sair da partida', () => {
  /** Partida com o usuário confirmado, que é quando o botão de sair existe. */
  function partidaComOUsuarioDentro(over = {}) {
    return envelope(criaPartida({
      maxPlayers: 10,
      participations: [criaParticipante({ userId: 'user-1' })],
      _count: { participations: 4 },
      ...over,
    }))
  }

  it('oferece sair para quem está confirmado', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())

    abrePartida()

    expect(await screen.findByRole('button', { name: /sair da partida/i })).toBeEnabled()
  })

  it('não oferece sair para quem está de fora', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({ maxPlayers: 10, _count: { participations: 3 } })),
    )

    abrePartida()
    await screen.findByRole('button', { name: /entrar na partida/i })

    expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
  })

  it('não oferece sair para o organizador — para ele existe cancelar', async () => {
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({
        organizerId: 'user-1',
        organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
        participations: [criaParticipante({ userId: 'user-1' })],
      })),
    )

    abrePartida()
    await screen.findByText(/você é o organizador desta partida/i)

    expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it.each(['FINISHED', 'CANCELLED'] as const)(
    'não oferece sair em partida %s — a API recusaria',
    async (status) => {
      buscaPartida.mockResolvedValue(partidaComOUsuarioDentro({ status }))

      abrePartida()
      await screen.findByText(/\d+ \/ \d+ confirmados/)

      expect(screen.queryByRole('button', { name: /sair da partida/i })).not.toBeInTheDocument()
    },
  )

  it('pede confirmação antes de sair — o clique sozinho não chama a API', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Sair desta partida?')).toBeInTheDocument()
    expect(saiDaPartida).not.toHaveBeenCalled()
  })

  it('desistir da confirmação não chama a API', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /continuar na partida/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(saiDaPartida).not.toHaveBeenCalled()
  })

  it('confirmar chama a API e a contagem de vagas cai na tela', async () => {
    buscaPartida
      .mockResolvedValueOnce(partidaComOUsuarioDentro())
      .mockResolvedValue(envelope(criaPartida({
        maxPlayers: 10,
        _count: { participations: 3 },
      })))
    const { user } = abrePartida()
    expect(await screen.findByText('4 / 10 confirmados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPartida).toHaveBeenCalledWith('quadra-1', 'partida-1', undefined)
    })
    // A vaga liberada tem que aparecer: é o efeito que o jogador foi buscar.
    expect(await screen.findByText('3 / 10 confirmados')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /entrar na partida/i })).toBeEnabled()
  })

  it('envia o motivo quando o jogador escreve um', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.type(screen.getByLabelText(/quer dizer o motivo/i), 'me machuquei no treino')
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPartida).toHaveBeenCalledWith('quadra-1', 'partida-1', 'me machuquei no treino')
    })
  })

  it('motivo só com espaços não vira corpo da requisição', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.type(screen.getByLabelText(/quer dizer o motivo/i), '   ')
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(saiDaPartida).toHaveBeenCalledWith('quadra-1', 'partida-1', undefined)
    })
  })

  it('limita o motivo ao que a API aceita', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    const campo = screen.getByLabelText(/quer dizer o motivo/i)

    // 200 é o limite do leavePartidaSchema no backend. Cortar aqui evita um
    // 422 que o jogador não teria como prever.
    expect(campo).toHaveAttribute('maxLength', '200')
    await user.type(campo, 'motivo')
    expect(screen.getByText('6 / 200')).toBeInTheDocument()
  })

  it('mostra a mensagem da API quando sair falha, e mantém o modal aberto', async () => {
    buscaPartida.mockResolvedValue(partidaComOUsuarioDentro())
    saiDaPartida.mockRejectedValue(erroDaApi('Partida já foi finalizada', 422))
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sair da partida/i }))
    await user.click(screen.getByRole('button', { name: /confirmar saída/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Partida já foi finalizada')
    })
    // Falhou: o jogador continua dentro, e o modal segue ali para ele tentar
    // de novo em vez de ficar sem saber o que aconteceu.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

/**
 * O detalhe é a tela onde a decisão de sortear naturalmente acontece: é ela que
 * lista os confirmados por extenso. Mesmo assim o sorteio só existia no cartão
 * da lista, e o caminho natural — clicar no cartão — levava justamente para
 * onde o botão não estava (#266).
 */
describe('PartidaDetail — sorteio de times', () => {
  const sorteiaTimes = vi.mocked(playerService.drawTeams)

  /** Partida em aberto, com o usuário logado como organizador dela. */
  function minhaPartida(over = {}) {
    return envelope(criaPartida({
      organizerId: 'user-1',
      organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
      ...over,
    }))
  }

  const DOIS_TIMES = criaSorteio({
    matchId: 'partida-1',
    teams: [
      { name: 'Time 1', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
      { name: 'Time 2', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
    ],
  })

  it('oferece "Sortear Times" ao organizador de partida em aberto', async () => {
    buscaPartida.mockResolvedValue(minhaPartida())

    abrePartida()

    expect(await screen.findByRole('button', { name: /sortear times/i })).toBeInTheDocument()
  })

  it('oferece o sorteio também quando a partida já lotou', async () => {
    buscaPartida.mockResolvedValue(minhaPartida({ status: 'FULL' }))

    abrePartida()

    expect(await screen.findByRole('button', { name: /sortear times/i })).toBeInTheDocument()
  })

  it('não oferece o sorteio a quem não é o organizador', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida()))

    abrePartida()

    expect(await screen.findByText('Quadra 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
  })

  // Depois de finalizada ou cancelada não há o que sortear, e é a mesma
  // condição que já esconde finalizar e cancelar.
  it.each(['FINISHED', 'CANCELLED'] as const)('não oferece o sorteio em partida %s', async (status) => {
    buscaPartida.mockResolvedValue(minhaPartida({ status }))

    abrePartida()

    expect(await screen.findByText(/você é o organizador/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
  })

  it('abre o modal sem sortear nada antes de o organizador mandar', async () => {
    buscaPartida.mockResolvedValue(minhaPartida())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sortear times/i }))

    expect(screen.getByRole('heading', { name: 'Sortear Times' })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toHaveValue('2')
    expect(sorteiaTimes).not.toHaveBeenCalled()
  })

  it('sorteia com o id da quadra e da partida do detalhe, e mostra os times', async () => {
    buscaPartida.mockResolvedValue(minhaPartida())
    sorteiaTimes.mockResolvedValue(envelope(DOIS_TIMES))
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    await waitFor(() => {
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'partida-1', 2, 'ALEATORIO')
    })
    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Bruno')).toBeInTheDocument()
  })

  it('fecha o modal e devolve o organizador ao detalhe', async () => {
    buscaPartida.mockResolvedValue(minhaPartida())
    sorteiaTimes.mockResolvedValue(envelope(DOIS_TIMES))
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))
    await user.click(await screen.findByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('heading', { name: 'Times Sorteados' })).not.toBeInTheDocument()
    // O detalhe continua ali — fechar o sorteio não navega para lugar nenhum.
    expect(screen.getByText('Quadra 1')).toBeInTheDocument()
  })

  it('mostra a mensagem da API quando o sorteio falha', async () => {
    buscaPartida.mockResolvedValue(minhaPartida())
    sorteiaTimes.mockRejectedValue(erroDaApi('Jogadores insuficientes para 2 times', 422))
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Jogadores insuficientes para 2 times')
    })
    // Continua no passo do slider, para o organizador ajustar e tentar de novo.
    expect(screen.getByRole('heading', { name: 'Sortear Times' })).toBeInTheDocument()
  })
})

/**
 * Refazer o sorteio sem sair do modal (#267).
 *
 * O sorteio é aleatório puro — o back embaralha e distribui em rodízio, então
 * os times empatam em número e nunca em força. Quando cai tudo de um lado, o
 * organizador precisava fechar o modal e refazer o caminho inteiro, o que na
 * prática o fazia aceitar um sorteio que ele não gostou.
 */
describe('PartidaDetail — refazer o sorteio', () => {
  const sorteiaTimes = vi.mocked(playerService.drawTeams)

  function minhaPartida() {
    return envelope(criaPartida({
      organizerId: 'user-1',
      organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
    }))
  }

  /** Dois times com a mesma dupla trocada de lado — é o que refazer produz. */
  function resultado(primeiro: string, segundo: string) {
    return envelope(
      criaSorteio({
        matchId: 'partida-1',
        teams: [
          { name: 'Time 1', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: primeiro })] },
          { name: 'Time 2', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: segundo })] },
        ],
      }),
    )
  }

  /** Abre o modal e sorteia uma vez, deixando o resultado na tela. */
  async function comOResultadoNaTela(teamCount = 2) {
    sorteiaTimes.mockResolvedValue(resultado('Ana', 'Bruno'))
    buscaPartida.mockResolvedValue(minhaPartida())
    const { user } = abrePartida()

    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    if (teamCount !== 2) {
      // fireEvent porque arrastar um range com o userEvent não é confiável.
      fireEvent.change(screen.getByRole('slider'), { target: { value: String(teamCount) } })
    }
    await user.click(screen.getByRole('button', { name: /sortear!/i }))
    await screen.findByRole('heading', { name: 'Times Sorteados' })
    sorteiaTimes.mockClear()

    return { user }
  }

  it('o resultado oferece refazer e fechar', async () => {
    await comOResultadoNaTela()

    expect(screen.getByRole('button', { name: /refazer sorteio/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
  })

  it('refaz com o mesmo número de times, sem voltar para o slider', async () => {
    const { user } = await comOResultadoNaTela(4)

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    await waitFor(() => {
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'partida-1', 4, 'ALEATORIO')
    })
    // Continua no resultado: nem o slider nem o "⚽ Sortear!" reaparecem.
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sortear!/i })).not.toBeInTheDocument()
  })

  it('a composição nova substitui a anterior no mesmo modal', async () => {
    const { user } = await comOResultadoNaTela()
    sorteiaTimes.mockResolvedValue(resultado('Carla', 'Diego'))

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    expect(await screen.findByText('Carla')).toBeInTheDocument()
    expect(screen.getByText('Diego')).toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
    expect(screen.queryByText('Bruno')).not.toBeInTheDocument()
  })

  it('desabilita e indica carregamento enquanto a chamada está em curso', async () => {
    const { user } = await comOResultadoNaTela()
    let concluiSorteio: (valor: unknown) => void = () => {}
    sorteiaTimes.mockReturnValue(new Promise((resolve) => { concluiSorteio = resolve }) as never)

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    const botao = screen.getByRole('button', { name: /sorteando/i })
    expect(botao).toBeDisabled()

    concluiSorteio(resultado('Carla', 'Diego'))
    expect(await screen.findByText('Carla')).toBeInTheDocument()
  })

  it('falhar ao refazer mantém o resultado anterior na tela', async () => {
    const { user } = await comOResultadoNaTela()
    sorteiaTimes.mockRejectedValue(erroDaApi('Jogadores insuficientes para 2 times', 422))

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Jogadores insuficientes para 2 times')
    })
    // A tela não fica vazia nem volta ao slider: o sorteio anterior continua ali.
    expect(screen.getByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refazer sorteio/i })).toBeEnabled()
  })

  it('fechar continua fazendo o que fazia', async () => {
    const { user } = await comOResultadoNaTela()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('heading', { name: 'Times Sorteados' })).not.toBeInTheDocument()
    expect(screen.getByText('Quadra 1')).toBeInTheDocument()
  })
})

/**
 * Modo de sorteio e leitura do equilíbrio (web#215, épico api#201).
 *
 * Duas coisas a proteger, e as duas são de produto:
 *
 * - **o modo equilibrado precisa ser encontrável.** Escondido atrás do mesmo
 *   botão de antes, ninguém descobre que existe;
 * - **o resultado precisa se explicar.** Uma lista de nomes não diz se ficou
 *   justo, e sem isso o organizador não confia no que a tela entregou.
 */
describe('PartidaDetail — modo de sorteio e equilíbrio', () => {
  const sorteiaTimes = vi.mocked(playerService.drawTeams)

  function minhaPartida() {
    return envelope(criaPartida({
      organizerId: 'user-1',
      organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
    }))
  }

  /** Abre o modal do sorteio, já como organizador. */
  async function abreSorteio() {
    buscaPartida.mockResolvedValue(minhaPartida())
    const { user } = abrePartida()
    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    return { user }
  }

  it('oferece os dois modos antes de sortear, com o aleatório marcado', async () => {
    await abreSorteio()

    expect(screen.getByRole('radio', { name: /aleatório/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /equilibrado/i })).not.toBeChecked()
  })

  // Cada modo explica o que faz: quem nunca ouviu falar do equilibrado precisa
  // saber o que ganha ao escolhê-lo, sem sair da tela para descobrir.
  it('cada modo diz em uma linha o que faz', async () => {
    await abreSorteio()

    expect(screen.getByText(/puro sorteio, como sempre foi/i)).toBeInTheDocument()
    expect(screen.getByText(/nível de cada um para deixar os times parelhos/i)).toBeInTheDocument()
  })

  it('escolher equilibrado manda o modo para a API', async () => {
    sorteiaTimes.mockResolvedValue(envelope(criaSorteio({ mode: 'EQUILIBRADO' })))
    const { user } = await abreSorteio()

    await user.click(screen.getByRole('radio', { name: /equilibrado/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    await waitFor(() => {
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'partida-1', 2, 'EQUILIBRADO')
    })
  })

  it('o texto de ajuda acompanha o modo escolhido', async () => {
    const { user } = await abreSorteio()

    expect(screen.getByText(/distribuídos aleatoriamente/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /equilibrado/i }))

    expect(screen.getByText(/times de força parecida/i)).toBeInTheDocument()
  })

  // Sem isto, refazer devolveria o organizador ao sorteio aleatório sem ele
  // pedir — e ele não teria como saber que o modo mudou.
  it('refazer mantém o modo escolhido', async () => {
    sorteiaTimes.mockResolvedValue(envelope(criaSorteio({ mode: 'EQUILIBRADO' })))
    const { user } = await abreSorteio()

    await user.click(screen.getByRole('radio', { name: /equilibrado/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))
    await screen.findByRole('heading', { name: 'Times Sorteados' })
    sorteiaTimes.mockClear()

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    await waitFor(() => {
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'partida-1', 2, 'EQUILIBRADO')
    })
  })

  describe('o resultado se explica', () => {
    /** Sorteia uma vez e devolve o controle já com o resultado na tela. */
    async function comResultado(sorteio: Parameters<typeof criaSorteio>[0]) {
      sorteiaTimes.mockResolvedValue(envelope(criaSorteio(sorteio)))
      const { user } = await abreSorteio()
      await user.click(screen.getByRole('button', { name: /sortear!/i }))
      await screen.findByRole('heading', { name: 'Times Sorteados' })
      return { user }
    }

    it('mostra a força de cada time', async () => {
      await comResultado({
        teams: [
          { name: 'Time 1', skillIndex: 150, averageSkill: 75, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
          { name: 'Time 2', skillIndex: 140, averageSkill: 70, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
        ],
      })

      expect(screen.getByText('força 75')).toBeInTheDocument()
      expect(screen.getByText('força 70')).toBeInTheDocument()
    })

    it('anuncia empate de força quando a diferença é zero', async () => {
      await comResultado({ balance: { spread: 0, target: 5, withinTarget: true, estimatedPlayers: 0 } })

      expect(screen.getByText(/times com a mesma força/i)).toBeInTheDocument()
    })

    it('diz de quanto foi a diferença quando não é zero', async () => {
      await comResultado({ balance: { spread: 3, target: 5, withinTarget: true, estimatedPlayers: 0 } })

      expect(screen.getByText(/diferença de força .*: 3 pontos/i)).toBeInTheDocument()
    })

    // Quando os jogadores presentes não permitem equilibrar, a tela diz isso em
    // vez de afirmar equilíbrio que não houve.
    it('avisa quando não deu para chegar ao alvo', async () => {
      await comResultado({ balance: { spread: 22, target: 5, withinTarget: false, estimatedPlayers: 0 } })

      expect(screen.getByText(/melhor possível com quem confirmou/i)).toBeInTheDocument()
    })

    it('avisa quantos jogadores entraram sem nível declarado', async () => {
      await comResultado({ balance: { spread: 1, target: 5, withinTarget: true, estimatedPlayers: 3 } })

      expect(screen.getByText(/3 jogadores entraram sem nível declarado/i)).toBeInTheDocument()
    })

    it('usa o singular quando é um jogador só', async () => {
      await comResultado({ balance: { spread: 1, target: 5, withinTarget: true, estimatedPlayers: 1 } })

      expect(screen.getByText(/1 jogador entrou sem nível declarado/i)).toBeInTheDocument()
    })

    it('não avisa nada quando todos têm nível declarado', async () => {
      await comResultado({ balance: { spread: 1, target: 5, withinTarget: true, estimatedPlayers: 0 } })

      expect(screen.queryByText(/sem nível declarado/i)).not.toBeInTheDocument()
    })

    // O aviso no time é o que separa "este número é medido" de "este número é
    // chute" na hora de olhar o cartão.
    it('marca o jogador estimado dentro do time', async () => {
      await comResultado({
        teams: [
          {
            name: 'Time 1',
            skillIndex: 50,
            averageSkill: 50,
            players: [criaJogadorSorteado({ id: 'u1', name: 'Ana', skill: { valor: 50, estimado: true } })],
          },
          {
            name: 'Time 2',
            skillIndex: 75,
            averageSkill: 75,
            players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno', skill: { valor: 75, estimado: false } })],
          },
        ],
      })

      expect(screen.getByText(/· estimado/)).toBeInTheDocument()
      expect(screen.getAllByText(/· estimado/)).toHaveLength(1)
    })
  })
})

/**
 * A janela de release: o app novo conversando com a API anterior.
 *
 * Front e API sobem separados, e por algumas horas o app que já tem o modo de
 * sorteio fala com uma API que não conhece `balance`, `averageSkill` nem
 * `skill`. Sem estes testes o resultado do sorteio dava tela branca — ler
 * `drawResult.balance.withinTarget` de um `balance` ausente estoura, e é o
 * organizador com o time reunido que vê isso.
 *
 * O sorteio continua funcionando; o que some é o que aquela versão da API não
 * sabe responder.
 */
describe('PartidaDetail — sorteio contra uma API anterior', () => {
  const sorteiaTimes = vi.mocked(playerService.drawTeams)

  /** O que a API devolvia antes da api#206: sem mode, sem balance, sem índices. */
  function respostaAntiga() {
    return envelope({
      matchId: 'partida-1',
      teamCount: 2,
      totalPlayers: 2,
      teams: [
        { name: 'Time 1', players: [{ id: 'u1', name: 'Ana', avatarUrl: null, badge: null }] },
        { name: 'Time 2', players: [{ id: 'u2', name: 'Bruno', avatarUrl: null, badge: null }] },
      ],
    } as never)
  }

  async function sorteiaComApiAntiga() {
    sorteiaTimes.mockResolvedValue(respostaAntiga())
    buscaPartida.mockResolvedValue(
      envelope(criaPartida({
        organizerId: 'user-1',
        organizer: { id: 'user-1', name: 'Mateus', avatarUrl: null },
      })),
    )
    const { user } = abrePartida()
    await user.click(await screen.findByRole('button', { name: /sortear times/i }))
    await user.click(screen.getByRole('button', { name: /sortear!/i }))
    return { user }
  }

  it('mostra os times normalmente', async () => {
    await sorteiaComApiAntiga()

    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Bruno')).toBeInTheDocument()
  })

  it('omite o resumo de equilíbrio em vez de estourar', async () => {
    await sorteiaComApiAntiga()

    await screen.findByRole('heading', { name: 'Times Sorteados' })
    expect(screen.queryByText(/mesma força|diferença de força/i)).not.toBeInTheDocument()
  })

  it('omite a força do time, que aquela API não calcula', async () => {
    await sorteiaComApiAntiga()

    await screen.findByRole('heading', { name: 'Times Sorteados' })
    expect(screen.queryByText(/^força/)).not.toBeInTheDocument()
  })

  it('não marca ninguém como estimado', async () => {
    await sorteiaComApiAntiga()

    await screen.findByRole('heading', { name: 'Times Sorteados' })
    expect(screen.queryByText(/· estimado/)).not.toBeInTheDocument()
  })

  it('refazer continua funcionando', async () => {
    const { user } = await sorteiaComApiAntiga()
    await screen.findByRole('heading', { name: 'Times Sorteados' })

    await user.click(screen.getByRole('button', { name: /refazer sorteio/i }))

    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
  })
})

/**
 * O portão na tela (#230).
 *
 * O critério central da issue é o terceiro: **o botão aparece desabilitado com
 * o motivo, em vez de falhar depois do clique**. Requisito que só vira erro
 * depois do clique é uma armadilha — o jogador não sabe se é regra, defeito ou
 * implicância com ele.
 */
describe('PartidaDetail — os requisitos antes do clique', () => {
  const COM_REQUISITO = {
    ...criaPartida({ id: 'partida-1' }),
    requirements: [{ type: 'MIN_MATCHES_PLAYED' as const, params: { min: 10 } }],
  }

  it('mostra as regras da partida antes de qualquer clique', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_REQUISITO))

    abrePartida()

    expect(await screen.findByTestId('requisitos-da-partida')).toBeInTheDocument()
    expect(screen.getByText('Ter jogado ao menos 10 partidas')).toBeInTheDocument()
  })

  it('desabilita o botão com o motivo, em vez de deixar o clique falhar', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_REQUISITO))
    consultaEntrada.mockResolvedValue(
      envelope({
        allowed: false,
        failures: [
          {
            code: 'REQUIREMENT_MIN_MATCHES_PLAYED',
            message: 'Esta partida exige 10 partidas jogadas, e você tem 3.',
            numeros: { exigido: 10, atual: 3 },
          },
        ],
        requirements: [
          {
            type: 'MIN_MATCHES_PLAYED' as const,
            params: { min: 10 },
            met: false,
            failure: {
              code: 'REQUIREMENT_MIN_MATCHES_PLAYED',
              message: 'Esta partida exige 10 partidas jogadas, e você tem 3.',
              numeros: { exigido: 10, atual: 3 },
            },
          },
        ],
      }),
    )

    abrePartida()

    const botao = await screen.findByRole('button', { name: /não atende aos requisitos/i })
    expect(botao).toBeDisabled()

    // A frase é a da API, e ela diz o exigido E o que a pessoa tem. "Você não
    // pode entrar" sozinho soaria como julgamento; com os dois números, soa
    // como a regra da partida que é.
    expect(screen.getByText('Esta partida exige 10 partidas jogadas, e você tem 3.')).toBeInTheDocument()
    expect(entraNaPartida).not.toHaveBeenCalled()
  })

  it('o motivo é lido junto com o botão, e não como texto solto', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_REQUISITO))
    consultaEntrada.mockResolvedValue(
      envelope({
        allowed: false,
        failures: [{ code: 'REQUIREMENT_MIN_MATCHES_PLAYED', message: 'Faltam partidas.' }],
        requirements: [
          { type: 'MIN_MATCHES_PLAYED' as const, params: { min: 10 }, met: false,
            failure: { code: 'REQUIREMENT_MIN_MATCHES_PLAYED', message: 'Faltam partidas.' } },
        ],
      }),
    )

    abrePartida()

    const botao = await screen.findByRole('button', { name: /não atende aos requisitos/i })
    const descrito = botao.getAttribute('aria-describedby')
    expect(descrito).toBeTruthy()
    expect(document.getElementById(descrito!)).toHaveTextContent('Faltam partidas.')
  })

  it('quem atende continua com o botão normal', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_REQUISITO))
    consultaEntrada.mockResolvedValue(
      envelope({
        allowed: true,
        failures: [],
        requirements: [{ type: 'MIN_MATCHES_PLAYED' as const, params: { min: 10 }, met: true }],
      }),
    )

    abrePartida()

    expect(await screen.findByRole('button', { name: /Entrar na partida/i })).toBeEnabled()
  })

  it('partida sem requisito não ganha enfeite nenhum', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida({ id: 'partida-1' })))

    abrePartida()

    await screen.findByRole('button', { name: /Entrar na partida/i })
    // A esmagadora maioria das partidas continua sem regra, e o caso comum não
    // pode ganhar caixa nova por causa do raro.
    expect(screen.queryByTestId('requisitos-da-partida')).not.toBeInTheDocument()
  })

  it('falha na consulta ao portão não bloqueia o botão', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_REQUISITO))
    consultaEntrada.mockRejectedValue(new Error('rede caiu'))

    abrePartida()

    // Sem resposta, a tela volta a se comportar como antes desta issue: o
    // clique tenta e a API decide. Barrar por falta de informação inventaria
    // uma recusa que ninguém verificou.
    expect(await screen.findByRole('button', { name: /Entrar na partida/i })).toBeEnabled()
  })
})

/**
 * O visitante sem sessão — #302.
 *
 * A rota estava atrás do `PrivateRoute`, e isso deixava **duas capacidades da
 * API mortas no front**: as regras de entrada, que a api#332 tornou legíveis
 * sem sessão de propósito, e o convite por link, que por desenho é aberto por
 * quem pode não ter conta.
 *
 * O que este bloco protege não é só "a página abre": é o recorte do que ela
 * mostra. A decisão foi registrada na issue — o visitante vê tudo que ajuda a
 * decidir se quer entrar, e não vê nome de participante.
 */
describe('PartidaDetail — visitante sem sessão', () => {
  /** Sem `marcarSessao()`: o AuthContext resolve para `isAuthenticated` falso. */
  function abreDeslogado(route = '/partida/partida-1') {
    return renderWithProviders(<PartidaDetail />, { route, path: '/partida/:eventId' })
  }

  const COM_GENTE = () =>
    criaPartida({
      maxPlayers: 10,
      participations: [
        criaParticipante({ userId: 'user-2', user: { id: 'user-2', name: 'Ana Prado', nickname: 'aninha', avatarUrl: null } }),
        criaParticipante({ userId: 'user-3', user: { id: 'user-3', name: 'Bia Duarte', nickname: null, avatarUrl: null } }),
      ],
    })

  beforeEach(() => {
    localStorage.clear()
  })

  it('abre a partida, com o que ajuda a decidir se quer entrar', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado()

    expect(await screen.findByText('Quadra 1')).toBeInTheDocument()
    // O nome do local aparece no cabeçalho e no link do mapa — daí o getAllBy.
    expect(screen.getAllByText(/Arena Sul/).length).toBeGreaterThan(0)
    // Data, valor e vagas: o que a pessoa precisa para decidir se quer entrar.
    expect(screen.getByText('2 / 10 confirmados')).toBeInTheDocument()
  })

  it('não mostra participante por nome, e mostra a contagem no lugar', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado()

    expect(await screen.findByText('2 de 10 confirmados')).toBeInTheDocument()
    // O ponto do teste. Um link de convite é encaminhável para qualquer lugar,
    // e nome de terceiro não ajuda ninguém a decidir se quer jogar.
    expect(screen.queryByText('Ana Prado')).not.toBeInTheDocument()
    expect(screen.queryByText('Bia Duarte')).not.toBeInTheDocument()
    expect(screen.queryByText(/aninha/)).not.toBeInTheDocument()
  })

  it('não mostra a chave PIX', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado()

    await screen.findByText('Quadra 1')
    // Já era verdade antes da #302 — o PIX está atrás de `isJoined || isOrganizer`
    // —, e é justamente por isso que vale um teste: a rota abriu, e o que
    // dependia de o visitante nunca chegar aqui precisa continuar de pé.
    expect(screen.queryByText('chave-pix@exemplo.com')).not.toBeInTheDocument()
  })

  it('não consulta o portão, que exige sessão', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado()

    await screen.findByText('Quadra 1')
    // A resposta do portão é sobre um jogador específico. Sem sessão não há
    // jogador, e a chamada só renderia 401.
    expect(consultaEntrada).not.toHaveBeenCalled()
  })

  it('o botão diz que falta entrar, e leva o endereço da partida junto', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado('/partida/partida-1?convite=token-abc')

    const link = await screen.findByRole('link', { name: /Entre para participar/i })

    // O `?convite=` viaja junto dentro do `next`: sem ele, quem chegou por link
    // de partida privada voltaria do cadastro para um 404.
    expect(link).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent('/partida/partida-1?convite=token-abc')}`,
    )
  })

  it('repassa o token do convite na leitura da partida', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado('/partida/partida-1?convite=token-abc')

    await waitFor(() => {
      expect(buscaPartida).toHaveBeenCalledWith('partida-1', 'token-abc')
    })
  })

  it('sem convite na URL, não inventa um', async () => {
    buscaPartida.mockResolvedValue(envelope(COM_GENTE()))

    abreDeslogado()

    await waitFor(() => {
      expect(buscaPartida).toHaveBeenCalledWith('partida-1', undefined)
    })
  })
})

/**
 * O link de convite que não vale mais — #229.
 *
 * A API distingue os três motivos de propósito, porque **o que a pessoa faz em
 * seguida muda em cada caso**: pedir um link novo, pedir mais vagas no link, ou
 * procurar o organizador. A tela repete a distinção pelo mesmo motivo.
 *
 * O outro ponto do bloco é o negativo: token chutado continua caindo no 404
 * comum, e o 404 não pode virar uma tela que confirme que a partida existe.
 */
describe('PartidaDetail — link de convite inválido', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const abreComConvite = () =>
    renderWithProviders(<PartidaDetail />, {
      route: '/partida/partida-1?convite=token-morto',
      path: '/partida/:eventId',
    })

  it.each([
    ['INVITE_REVOKED',   /foi cancelado/i,     /revogou o link/i],
    ['INVITE_EXPIRED',   /expirou/i,           /tinha prazo/i],
    ['INVITE_EXHAUSTED', /usado o bastante/i,  /limite de entradas/i],
  ])('%s ganha tela própria, com o que fazer em seguida', async (code, titulo, explicacao) => {
    buscaPartida.mockRejectedValue(erroDaApi('link inválido', 403, code))

    abreComConvite()

    const caixa = await screen.findByTestId('link-invalido')
    expect(within(caixa).getByText(titulo)).toBeInTheDocument()
    expect(within(caixa).getByText(explicacao)).toBeInTheDocument()
  })

  it('não manda a pessoa para a busca com um toast — o motivo fica na tela', async () => {
    buscaPartida.mockRejectedValue(erroDaApi('link inválido', 403, 'INVITE_REVOKED'))

    abreComConvite()

    await screen.findByTestId('link-invalido')
    // Quem chegou por um link morto precisa poder ler o motivo com calma e
    // mostrá-lo para quem mandou o link. Toast some.
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('token chutado continua caindo no comportamento de partida inexistente', async () => {
    // A API responde 404 — o mesmo de sempre — para token que não existe ou que
    // foi emitido para outra partida. É isso que impede sondar partida privada no
    // chute, e a tela não pode transformar esse 404 numa confirmação.
    buscaPartida.mockRejectedValue(erroDaApi('não encontrada', 404, 'EVENT_NOT_FOUND'))

    abreComConvite()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Partida não encontrada.'))
    expect(screen.queryByTestId('link-invalido')).not.toBeInTheDocument()
  })
})

describe('PartidaDetail — chamar gente', () => {
  it('o organizador tem o botão de compartilhar', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida({
      organizerId: USUARIO.id,
      organizer: { id: USUARIO.id, name: USUARIO.name, avatarUrl: null },
    })))

    renderWithProviders(<PartidaDetail />, { route: '/partida/partida-1', path: '/partida/:eventId' })

    // Vem antes de "Sortear Times": é a ação de quando a partida ainda não
    // encheu, e é a razão de o organizador abrir esta tela faltando gente.
    expect(await screen.findByRole('button', { name: /chamar gente/i })).toBeInTheDocument()
  })

  it('quem não organiza não tem o botão', async () => {
    buscaPartida.mockResolvedValue(envelope(criaPartida()))

    renderWithProviders(<PartidaDetail />, { route: '/partida/partida-1', path: '/partida/:eventId' })

    await screen.findByText('Quadra 1')
    expect(screen.queryByRole('button', { name: /chamar gente/i })).not.toBeInTheDocument()
  })
})
