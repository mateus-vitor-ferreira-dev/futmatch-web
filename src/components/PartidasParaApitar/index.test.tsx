/**
 * A lista de quem apita.
 *
 * O critério da #261 é *"o árbitro encontra as partidas dele sem precisar
 * procurar campeonato por campeonato"* — daí a lista atravessar campeonatos e
 * cada linha dizer de qual torneio e divisão a partida é.
 *
 * O teste mais importante é o do **vazio**: o componente some quando não há
 * nada para apitar. É isso que permite ele viver na página de Torneios sem
 * virar ruído para as contas que nunca vão apitar — e é a alternativa a um item
 * de menu permanente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import type { RefereeingMatch, TournamentMatchSide } from '../../types/api'
import PartidasParaApitar from './index'

vi.mock('../../services/tournaments')

import * as service from '../../services/tournaments'

const listar = vi.mocked(service.getRefereeingMatches)
const enviar = vi.mocked(service.submitMatchResult)

const lado = (id: string, name: string): TournamentMatchSide => ({
  id, status: 'APPROVED', user: { id: `u-${id}`, name, avatarUrl: null, badge: null },
})

function partida(over: Partial<RefereeingMatch> = {}): RefereeingMatch {
  return {
    id: 'm1', divisionId: 'div-1', round: 1, orderInRound: 1,
    participantAId: 'insc-1', participantBId: 'insc-2',
    nextMatchId: null, courtId: 'q1', scheduledAt: '2026-09-01T15:00:00.000Z',
    status: 'SCHEDULED', scoreA: null, scoreB: null, winnerId: null, refereeId: 'u-arb',
    participantA: lado('insc-1', 'Juliana Prado'),
    participantB: lado('insc-2', 'Marcelo Vidal'),
    winner: null,
    court: { id: 'q1', name: 'Quadra 2', type: 'BEACH_TENNIS' },
    referee: null,
    division: { id: 'div-1', name: 'Masculino A', tournament: { id: 't1', name: 'Copa Só+1', status: 'IN_PROGRESS' } },
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

const envelope = <T,>(data: T) => ({ success: true as const, data })

beforeEach(() => {
  vi.clearAllMocks()
  listar.mockResolvedValue(envelope([partida()]))
  enviar.mockResolvedValue(envelope(partida({ status: 'FINISHED', scoreA: 12, scoreB: 10, winnerId: 'insc-1' })))
})

describe('PartidasParaApitar', () => {
  it('não aparece quando não há nada para apitar', async () => {
    listar.mockResolvedValue(envelope([]))

    const { container } = renderWithProviders(<PartidasParaApitar />)

    // É o que permite viver na página de Torneios sem virar ruído para quem
    // nunca vai apitar — a alternativa seria um item de menu permanente.
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('some também quando a API falha, sem derrubar a página', async () => {
    listar.mockRejectedValue(new Error('rede caiu'))

    const { container } = renderWithProviders(<PartidasParaApitar />)

    // A listagem de campeonatos é o conteúdo principal da página; uma seção
    // secundária que falha não pode levá-la junto.
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('diz de qual campeonato, divisão, quadra e horário é cada partida', async () => {
    renderWithProviders(<PartidasParaApitar />)

    expect(await screen.findByText('Juliana Prado × Marcelo Vidal')).toBeInTheDocument()
    // Sem o contexto o árbitro saberia o placar a lançar e não saberia onde.
    const contexto = screen.getByText(/Copa Só\+1/)
    expect(contexto).toHaveTextContent('Masculino A')
    expect(contexto).toHaveTextContent('Quadra 2')
  })

  it('lança o placar e a linha passa a mostrar o resultado', async () => {
    const { user } = renderWithProviders(<PartidasParaApitar />)

    await user.click(await screen.findByRole('button', { name: 'Lançar placar' }))
    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.type(screen.getByLabelText('Placar de Marcelo Vidal'), '10')
    await user.click(screen.getByRole('button', { name: 'Lançar placar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar e lançar' }))

    expect(await screen.findByText('12 × 10')).toBeInTheDocument()
    // O formulário fecha sozinho: deixá-lo aberto convidaria a lançar de novo.
    expect(screen.queryByLabelText('Placar de Juliana Prado')).not.toBeInTheDocument()
  })

  it('partida já encerrada mostra o resultado, e não o botão', async () => {
    listar.mockResolvedValue(envelope([
      partida({ status: 'FINISHED', scoreA: 21, scoreB: 15, winnerId: 'insc-1' }),
    ]))

    renderWithProviders(<PartidasParaApitar />)

    expect(await screen.findByText('21 × 15')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lançar placar' })).not.toBeInTheDocument()
  })

  it('W.O. já lançado é dito por extenso, porque não tem placar que o explique', async () => {
    listar.mockResolvedValue(envelope([partida({ status: 'WALKOVER', winnerId: 'insc-2' })]))

    renderWithProviders(<PartidasParaApitar />)

    expect(await screen.findByText('W.O. lançado')).toBeInTheDocument()
  })
})
