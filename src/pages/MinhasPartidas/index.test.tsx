/**
 * Fluxo crítico: as partidas do jogador.
 *
 * A tela junta dois papéis no mesmo lugar — o jogador que entrou e o
 * organizador que criou. As duas abas consomem endpoints diferentes que
 * devolvem FORMATOS diferentes: "Participando" traz `Participation[]`, com a
 * partida aninhada, e "Criados por mim" traz `Partida[]` direto. O mesmo estado
 * guarda as duas formas, e quem normaliza é o render.
 *
 * É exatamente o tipo de acoplamento que quebra em silêncio quando alguém
 * mexe no formato de uma das rotas: a tela não dá erro, só não mostra nada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaJogadorSorteado, criaPartida, criaSorteio, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import type { Participation } from '../../types/api'
import MinhasPartidas from './index'

// O cartão inteiro navega para o detalhe da partida. Espionar o `useNavigate` é o
// único jeito de provar que os botões de dentro dele NÃO disparam essa navegação:
// no teste o componente é montado direto, então a rota mudar não desmonta nada e o
// modal aparece do mesmo jeito — foi assim que a #246 passou despercebida.
const { navegar } = vi.hoisted(() => ({ navegar: vi.fn() }))
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => navegar,
}))
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

const buscaParticipando = vi.mocked(playerService.getMyParticipatingEvents)
const buscaCriadas = vi.mocked(playerService.getMyCreatedEvents)
const sorteiaTimes = vi.mocked(playerService.drawTeams)

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id: 'user-1' })))
  vi.mocked(notificationService.list).mockResolvedValue([])
  vi.mocked(playerService.getCourts).mockResolvedValue(envelope([]))
  buscaParticipando.mockResolvedValue(envelope([]))
  buscaCriadas.mockResolvedValue(envelope([]))
})

/** Envelope da aba "Participando": a partida vem aninhada na participação. */
function participacao(partida = criaPartida()): Participation {
  return {
    matchId: partida.id,
    userId: 'user-1',
    attended: null,
    joinedAt: '2026-02-01T12:00:00.000Z',
    match: partida,
  }
}

describe('MinhasPartidas — as duas abas', () => {
  it('abre em "Participando" e busca as participações', async () => {
    buscaParticipando.mockResolvedValue(
      envelope([participacao(criaPartida({
        court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG', latitude: -21.24, longitude: -44.99 } },
      }))]),
    )

    renderWithProviders(<MinhasPartidas />)

    expect(await screen.findByText('Arena Sul')).toBeInTheDocument()
    expect(buscaParticipando).toHaveBeenCalled()
    expect(buscaCriadas).not.toHaveBeenCalled()
  })

  it('o + Criar Partida leva ao assistente, e não abre modal aqui', async () => {
    buscaParticipando.mockResolvedValue(envelope([]))

    const { user } = renderWithProviders(<MinhasPartidas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: /criar partida/i }))

    expect(navegar).toHaveBeenCalledWith('/criar-partida')
    // Havia um segundo fluxo de criação aqui, com o `GET /courts` inteiro num
    // `select` só. O botão não pode voltar a abri-lo. Ver #268.
    expect(screen.queryByRole('heading', { name: 'Criar Partida' })).not.toBeInTheDocument()
  })

  it('trocar de aba busca no outro endpoint', async () => {
    const { user } = renderWithProviders(<MinhasPartidas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    await waitFor(() => expect(buscaCriadas).toHaveBeenCalled())
  })

  it('desembrulha a partida aninhada na aba Participando', async () => {
    buscaParticipando.mockResolvedValue(
      envelope([participacao(criaPartida({
        maxPlayers: 10,
        _count: { participations: 6 },
      }))]),
    )

    renderWithProviders(<MinhasPartidas />)

    // Se o `event.match || event` parar de funcionar, o card some sem erro.
    expect(await screen.findByText('6 / 10 confirmados')).toBeInTheDocument()
  })

  it('não quebra quando a API falha — a tela fica vazia, sem estourar', async () => {
    buscaParticipando.mockRejectedValue(erroDaApi('fora do ar', 500))

    renderWithProviders(<MinhasPartidas />)

    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Participando' })).toBeInTheDocument()
  })
})

describe('MinhasPartidas — ações de organizador', () => {
  const PARTIDA_ABERTA = criaPartida({
    id: 'minha-partida',
    status: 'WAITING',
    pixKey: 'pix@arena.com',
    court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG', latitude: -21.24, longitude: -44.99 } },
  })

  async function abreAbaCriados(partidas = [PARTIDA_ABERTA]) {
    buscaCriadas.mockResolvedValue(envelope(partidas))
    const resultado = renderWithProviders(<MinhasPartidas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    await resultado.user.click(screen.getByRole('button', { name: 'Criados por mim' }))
    await screen.findByText('Arena Sul')
    return resultado
  }

  it('mostra a chave Pix só na aba de partidas criadas', async () => {
    buscaParticipando.mockResolvedValue(envelope([participacao(PARTIDA_ABERTA)]))
    const { user } = renderWithProviders(<MinhasPartidas />)
    await screen.findByText('Arena Sul')

    expect(screen.queryByText(/PIX: pix@arena.com/)).not.toBeInTheDocument()

    buscaCriadas.mockResolvedValue(envelope([PARTIDA_ABERTA]))
    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    expect(await screen.findByText(/PIX: pix@arena.com/)).toBeInTheDocument()
  })

  it('oferece sortear, finalizar e cancelar em partida aberta', async () => {
    await abreAbaCriados()

    expect(screen.getByRole('button', { name: /sortear times/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('esconde as ações em partida já finalizada, e oferece confirmar presenças', async () => {
    await abreAbaCriados([criaPartida({
      ...PARTIDA_ABERTA,
      status: 'FINISHED',
    })])

    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar presenças/i })).toBeInTheDocument()
  })

  it('os controles do cartão não levam para o detalhe da partida', async () => {
    const { user } = await abreAbaCriados()
    // Finalizar e Cancelar pedem confirmação; recusar mantém o teste no clique,
    // que é o que está sob prova aqui.
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    for (const nome of [/copiar/i, /finalizar/i, /cancelar/i]) {
      await user.click(screen.getByRole('button', { name: nome }))
      expect(navegar).not.toHaveBeenCalled()
    }

    await user.click(screen.getByRole('button', { name: /sortear times/i }))

    expect(navegar).not.toHaveBeenCalled()
    // Sem o stopPropagation o modal abria e o cartão navegava no mesmo clique.
    expect(screen.getByRole('heading', { name: 'Sortear Times' })).toBeInTheDocument()
  })

  it('clicar no corpo do cartão continua abrindo o detalhe', async () => {
    const { user } = await abreAbaCriados()

    await user.click(screen.getByText('Arena Sul'))

    expect(navegar).toHaveBeenCalledWith('/partida/minha-partida')
  })

  it('esconde as ações em partida cancelada', async () => {
    await abreAbaCriados([criaPartida({ ...PARTIDA_ABERTA, status: 'CANCELLED' })])

    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar presenças/i })).not.toBeInTheDocument()
  })
})

describe('MinhasPartidas — sorteio de times', () => {
  const PARTIDA = criaPartida({
    id: 'minha-partida',
    courtId: 'quadra-1',
    status: 'WAITING',
    court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG', latitude: -21.24, longitude: -44.99 } },
  })

  async function abreSorteio() {
    buscaCriadas.mockResolvedValue(envelope([PARTIDA]))
    const resultado = renderWithProviders(<MinhasPartidas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    await resultado.user.click(screen.getByRole('button', { name: 'Criados por mim' }))
    await resultado.user.click(await screen.findByRole('button', { name: /sortear times/i }))
    return resultado
  }

  it('abre com 2 times, que é o mínimo que faz sentido', async () => {
    await abreSorteio()

    expect(screen.getByRole('heading', { name: 'Sortear Times' })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toHaveValue('2')
    expect(sorteiaTimes).not.toHaveBeenCalled()
  })

  it('sorteia com a quantidade escolhida e mostra os times', async () => {
    const { user } = await abreSorteio()
    sorteiaTimes.mockResolvedValue(envelope(criaSorteio({
      // O cabeçalho conta `totalPlayers`, que aqui é maior que os nomes
      // listados de propósito: o teste é sobre o texto do cabeçalho.
      totalPlayers: 4,
      teams: [
        { name: 'Time 1', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
        { name: 'Time 2', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
      ],
    })))

    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    await waitFor(() => {
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'minha-partida', 2, 'ALEATORIO')
    })
    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('4 jogadores distribuídos em 2 times')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Bruno')).toBeInTheDocument()
  })

  // O ✕ diz que os dois times jogam um contra o outro. Com três ou mais ele não
  // teria o que separar, e o resultado volta a ser uma grade de cartões.
  it('marca o confronto com o ✕ quando o sorteio dá exatamente 2 times', async () => {
    const { user } = await abreSorteio()
    sorteiaTimes.mockResolvedValue(envelope(criaSorteio({
      teams: [
        { name: 'Time 1', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
        { name: 'Time 2', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
      ],
    })))

    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('não marca confronto quando o sorteio dá 3 times ou mais', async () => {
    const { user } = await abreSorteio()
    sorteiaTimes.mockResolvedValue(envelope(criaSorteio({
      teams: [
        { name: 'Time 1', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
        { name: 'Time 2', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
        { name: 'Time 3', skillIndex: 50, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u3', name: 'Carla' })] },
      ],
    })))

    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    expect(await screen.findByRole('heading', { name: 'Times Sorteados' })).toBeInTheDocument()
    expect(screen.getByText('Carla')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('mostra a mensagem da API quando o sorteio falha', async () => {
    const { user } = await abreSorteio()
    sorteiaTimes.mockRejectedValue(erroDaApi('Jogadores insuficientes para 2 times', 422))

    await user.click(screen.getByRole('button', { name: /sortear!/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Jogadores insuficientes para 2 times')
    })
    // Continua no formulário do sorteio, para o organizador ajustar e tentar.
    expect(screen.getByRole('heading', { name: 'Sortear Times' })).toBeInTheDocument()
  })
})

/**
 * O estado vazio das duas abas (#379).
 *
 * Antes disto, `events` vazio produzia um `<Grid>` sem filho nenhum: só o
 * cabeçalho, as duas abas e um vão. O usuário não tinha como distinguir "não
 * tenho partida" de "a tela quebrou" de "ainda está carregando" — três coisas
 * bem diferentes com a mesma aparência.
 */
describe('MinhasPartidas — o vazio de cada aba (#379)', () => {
  /**
   * O vazio é uma região com nome, e as buscas entram por ela.
   *
   * Não é preciosismo de teste: o botão do vazio e o do cabeçalho podem ter o
   * mesmo rótulo ("Criar Partida"), e uma busca solta por esse nome acha os
   * dois. Entrar pela região é o que separa "o botão que o vazio oferece" de
   * "o botão que sempre esteve lá" — que é exatamente a distinção que a issue
   * pede para preservar.
   */
  const vazio = async () => within(await screen.findByRole('region', { name: /Você/ }))

  it('a aba Participando convida a achar uma partida', async () => {
    renderWithProviders(<MinhasPartidas />)

    expect(await screen.findByText('Você não está em nenhuma partida')).toBeInTheDocument()
    expect((await vazio()).getByRole('button', { name: 'Quero Jogar' })).toBeInTheDocument()
  })

  it('a aba Criados por mim convida a abrir uma', async () => {
    const { user } = renderWithProviders(<MinhasPartidas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    expect(await screen.findByText('Você nunca criou nenhuma partida')).toBeInTheDocument()
    expect((await vazio()).getByRole('button', { name: 'Criar Partida' })).toBeInTheDocument()
  })

  /**
   * Os dois destinos são diferentes de propósito: quem não está em partida
   * nenhuma quer **achar** uma, quem nunca criou quer **abrir** uma. Este teste
   * é o que impede alguém de "simplificar" mandando os dois para o mesmo lugar.
   */
  it('cada vazio leva para um lugar diferente', async () => {
    const { user } = renderWithProviders(<MinhasPartidas />)

    await user.click((await vazio()).getByRole('button', { name: 'Quero Jogar' }))
    expect(navegar).toHaveBeenCalledWith('/quero-jogar')

    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))
    await user.click((await vazio()).getByRole('button', { name: 'Criar Partida' }))
    expect(navegar).toHaveBeenCalledWith('/criar-partida')
  })

  /**
   * O caso misto, e o motivo de o estado ser por aba e não da página: um estado
   * só, no nível da página, esconderia a lista que existe.
   */
  it('com partida numa aba e nada na outra, mostra lista numa e vazio na outra', async () => {
    buscaParticipando.mockResolvedValue(envelope([participacao(criaPartida({ id: 'p-1' }))]))
    buscaCriadas.mockResolvedValue(envelope([]))

    const { user } = renderWithProviders(<MinhasPartidas />)

    // Participando tem uma partida: nada de vazio aqui.
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    expect(screen.queryByText('Você não está em nenhuma partida')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    expect(await screen.findByText('Você nunca criou nenhuma partida')).toBeInTheDocument()
  })

  /**
   * Vazio não é carregando. Um vazio que aparecesse durante a busca diria "você
   * não está em nenhuma partida" para quem tem doze — e apareceria a cada troca
   * de aba, piscando.
   */
  it('enquanto carrega mostra o esqueleto, e não o vazio', async () => {
    let liberar: (v: unknown) => void = () => {}
    buscaParticipando.mockReturnValue(new Promise((resolve) => { liberar = resolve }) as never)

    renderWithProviders(<MinhasPartidas />)

    expect(screen.queryByText('Você não está em nenhuma partida')).not.toBeInTheDocument()

    liberar(envelope([]))

    // E aparece assim que a resposta chega — o vazio é o depois, não o durante.
    expect(await screen.findByText('Você não está em nenhuma partida')).toBeInTheDocument()
  })

  /**
   * O botão do cabeçalho é outro caminho, e não foi substituído: quem já sabe
   * o que quer não devia precisar passar pelo vazio.
   */
  it('o botão Criar Partida do cabeçalho continua onde estava', async () => {
    renderWithProviders(<MinhasPartidas />)
    const regiao = await vazio()

    // Na aba Participando o vazio oferece "Quero Jogar" — e o "Criar Partida"
    // do cabeçalho continua na tela, fora da região do vazio. São dois caminhos
    // que coexistem, e não um substituindo o outro.
    expect(regiao.queryByRole('button', { name: 'Criar Partida' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Criar Partida/ })).toBeInTheDocument()
  })
})
