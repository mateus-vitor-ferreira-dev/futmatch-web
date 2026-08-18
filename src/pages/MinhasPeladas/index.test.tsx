/**
 * Fluxo crítico: as peladas do jogador.
 *
 * A tela junta dois papéis no mesmo lugar — o jogador que entrou e o
 * organizador que criou. As duas abas consomem endpoints diferentes que
 * devolvem FORMATOS diferentes: "Participando" traz `Participation[]`, com a
 * pelada aninhada, e "Criados por mim" traz `Pelada[]` direto. O mesmo estado
 * guarda as duas formas, e quem normaliza é o render.
 *
 * É exatamente o tipo de acoplamento que quebra em silêncio quando alguém
 * mexe no formato de uma das rotas: a tela não dá erro, só não mostra nada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaJogadorSorteado, criaPelada, criaSorteio, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import type { Participation } from '../../types/api'
import MinhasPeladas from './index'

// O cartão inteiro navega para o detalhe da pelada. Espionar o `useNavigate` é o
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

/** Envelope da aba "Participando": a pelada vem aninhada na participação. */
function participacao(pelada = criaPelada()): Participation {
  return {
    peladaId: pelada.id,
    userId: 'user-1',
    attended: null,
    joinedAt: '2026-02-01T12:00:00.000Z',
    pelada,
  }
}

describe('MinhasPeladas — as duas abas', () => {
  it('abre em "Participando" e busca as participações', async () => {
    buscaParticipando.mockResolvedValue(
      envelope([participacao(criaPelada({
        court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } },
      }))]),
    )

    renderWithProviders(<MinhasPeladas />)

    expect(await screen.findByText('Arena Sul')).toBeInTheDocument()
    expect(buscaParticipando).toHaveBeenCalled()
    expect(buscaCriadas).not.toHaveBeenCalled()
  })

  it('o + Criar Jogo leva ao assistente, e não abre modal aqui', async () => {
    buscaParticipando.mockResolvedValue(envelope([]))

    const { user } = renderWithProviders(<MinhasPeladas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: /criar jogo/i }))

    expect(navegar).toHaveBeenCalledWith('/criar-pelada')
    // Havia um segundo fluxo de criação aqui, com o `GET /courts` inteiro num
    // `select` só. O botão não pode voltar a abri-lo. Ver #268.
    expect(screen.queryByRole('heading', { name: 'Criar Jogo' })).not.toBeInTheDocument()
  })

  it('trocar de aba busca no outro endpoint', async () => {
    const { user } = renderWithProviders(<MinhasPeladas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    await waitFor(() => expect(buscaCriadas).toHaveBeenCalled())
  })

  it('desembrulha a pelada aninhada na aba Participando', async () => {
    buscaParticipando.mockResolvedValue(
      envelope([participacao(criaPelada({
        maxPlayers: 10,
        _count: { participations: 6 },
      }))]),
    )

    renderWithProviders(<MinhasPeladas />)

    // Se o `event.pelada || event` parar de funcionar, o card some sem erro.
    expect(await screen.findByText('6 / 10 confirmados')).toBeInTheDocument()
  })

  it('não quebra quando a API falha — a tela fica vazia, sem estourar', async () => {
    buscaParticipando.mockRejectedValue(erroDaApi('fora do ar', 500))

    renderWithProviders(<MinhasPeladas />)

    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Participando' })).toBeInTheDocument()
  })
})

describe('MinhasPeladas — ações de organizador', () => {
  const PELADA_ABERTA = criaPelada({
    id: 'minha-pelada',
    status: 'WAITING',
    pixKey: 'pix@arena.com',
    court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } },
  })

  async function abreAbaCriados(peladas = [PELADA_ABERTA]) {
    buscaCriadas.mockResolvedValue(envelope(peladas))
    const resultado = renderWithProviders(<MinhasPeladas />)
    await waitFor(() => expect(buscaParticipando).toHaveBeenCalled())
    await resultado.user.click(screen.getByRole('button', { name: 'Criados por mim' }))
    await screen.findByText('Arena Sul')
    return resultado
  }

  it('mostra a chave Pix só na aba de peladas criadas', async () => {
    buscaParticipando.mockResolvedValue(envelope([participacao(PELADA_ABERTA)]))
    const { user } = renderWithProviders(<MinhasPeladas />)
    await screen.findByText('Arena Sul')

    expect(screen.queryByText(/PIX: pix@arena.com/)).not.toBeInTheDocument()

    buscaCriadas.mockResolvedValue(envelope([PELADA_ABERTA]))
    await user.click(screen.getByRole('button', { name: 'Criados por mim' }))

    expect(await screen.findByText(/PIX: pix@arena.com/)).toBeInTheDocument()
  })

  it('oferece sortear, finalizar e cancelar em pelada aberta', async () => {
    await abreAbaCriados()

    expect(screen.getByRole('button', { name: /sortear times/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('esconde as ações em pelada já finalizada, e oferece confirmar presenças', async () => {
    await abreAbaCriados([criaPelada({
      ...PELADA_ABERTA,
      status: 'FINISHED',
    })])

    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar presenças/i })).toBeInTheDocument()
  })

  it('os controles do cartão não levam para o detalhe da pelada', async () => {
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

    expect(navegar).toHaveBeenCalledWith('/pelada/minha-pelada')
  })

  it('esconde as ações em pelada cancelada', async () => {
    await abreAbaCriados([criaPelada({ ...PELADA_ABERTA, status: 'CANCELLED' })])

    expect(screen.queryByRole('button', { name: /sortear times/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar presenças/i })).not.toBeInTheDocument()
  })
})

describe('MinhasPeladas — sorteio de times', () => {
  const PELADA = criaPelada({
    id: 'minha-pelada',
    courtId: 'quadra-1',
    status: 'WAITING',
    court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } },
  })

  async function abreSorteio() {
    buscaCriadas.mockResolvedValue(envelope([PELADA]))
    const resultado = renderWithProviders(<MinhasPeladas />)
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
      expect(sorteiaTimes).toHaveBeenCalledWith('quadra-1', 'minha-pelada', 2, 'ALEATORIO')
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
