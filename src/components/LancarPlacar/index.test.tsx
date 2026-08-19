/**
 * O placar de uma partida do mata-mata.
 *
 * A regra que mais pesa aqui é a **confirmação**: placar lançado fecha a
 * partida e faz o vencedor subir de rodada, e a API só permite corrigir
 * enquanto a partida seguinte não tiver resultado. O clique não pode ser mais
 * barato que a consequência.
 *
 * As validações de empate e de placar ausente **repetem** o que a API já
 * recusa, e isso é deliberado — barrar aqui poupa o árbitro de digitar de novo,
 * e a autoridade segue no servidor. Por isso há também um teste do erro da API
 * chegando à tela: a tela não presume que já filtrou tudo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import type { TournamentMatch, TournamentMatchSide } from '../../types/api'
import LancarPlacar from './index'

vi.mock('../../services/tournaments')

import * as service from '../../services/tournaments'

const enviar = vi.mocked(service.submitMatchResult)

const lado = (id: string, name: string): TournamentMatchSide => ({
  id, status: 'APPROVED', user: { id: `u-${id}`, name, avatarUrl: null, badge: null },
})

const juliana = lado('insc-1', 'Juliana Prado')
const marcelo = lado('insc-2', 'Marcelo Vidal')

function partida(over: Partial<TournamentMatch> = {}): TournamentMatch {
  return {
    id: 'm1', divisionId: 'div-1', round: 1, orderInRound: 1,
    participantAId: 'insc-1', participantBId: 'insc-2',
    nextMatchId: 'm-final', courtId: null, scheduledAt: null,
    status: 'SCHEDULED', scoreA: null, scoreB: null, winnerId: null, refereeId: 'u-arb',
    participantA: juliana, participantB: marcelo, winner: null, court: null, referee: null,
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

const envelope = <T,>(data: T) => ({ success: true as const, data })

beforeEach(() => {
  vi.clearAllMocks()
  enviar.mockResolvedValue(envelope(partida({ status: 'FINISHED', scoreA: 12, scoreB: 10, winnerId: 'insc-1' })))
})

const monta = (p = partida(), onLancado = vi.fn()) => ({
  onLancado,
  ...renderWithProviders(
    <LancarPlacar tournamentId="t1" divisionId="div-1" match={p} onLancado={onLancado} />,
  ),
})

describe('LancarPlacar — o que impede o envio', () => {
  it('placar pela metade não deixa lançar, e diz por quê', async () => {
    const { user } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')

    expect(screen.getByRole('button', { name: 'Lançar placar' })).toBeDisabled()
    expect(screen.getByText(/Preencha o placar dos dois lados/)).toBeInTheDocument()
  })

  it('empate é barrado antes de enviar, com a razão explicada', async () => {
    const { user } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.type(screen.getByLabelText('Placar de Marcelo Vidal'), '12')

    // A API também recusa (DRAW_NOT_ALLOWED). Barrar aqui é para o árbitro não
    // descobrir isso depois de confirmar.
    expect(screen.getByText(/não admite empate/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lançar placar' })).toBeDisabled()
    expect(enviar).not.toHaveBeenCalled()
  })

  it('partida sem os dois lados não oferece formulário', () => {
    monta(partida({ participantBId: null, participantB: null }))

    // A API responde 422 aqui, então um formulário seria um erro garantido.
    expect(screen.getByText(/ainda não tem os dois participantes definidos/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Placar de Juliana Prado')).not.toBeInTheDocument()
  })
})

describe('LancarPlacar — confirmar e enviar', () => {
  it('confirma dizendo o que vai acontecer, e só então envia', async () => {
    const { user, onLancado } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.type(screen.getByLabelText('Placar de Marcelo Vidal'), '10')
    await user.click(screen.getByRole('button', { name: 'Lançar placar' }))

    // A confirmação diz o placar e quem avança — "tem certeza?" não informaria
    // nada que ajudasse a decidir.
    expect(screen.getByText(/Juliana Prado 12 × 10 Marcelo Vidal — Juliana Prado avança/)).toBeInTheDocument()
    expect(enviar).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar e lançar' }))

    await waitFor(() =>
      expect(enviar).toHaveBeenCalledWith('t1', 'div-1', 'm1', { scoreA: 12, scoreB: 10 }),
    )
    expect(onLancado).toHaveBeenCalled()
  })

  it('dá para voltar da confirmação sem enviar nada', async () => {
    const { user } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.type(screen.getByLabelText('Placar de Marcelo Vidal'), '10')
    await user.click(screen.getByRole('button', { name: 'Lançar placar' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByLabelText('Placar de Juliana Prado')).toHaveValue(12)
    expect(enviar).not.toHaveBeenCalled()
  })

  it('W.O. manda o vencedor, e nenhum placar junto', async () => {
    enviar.mockResolvedValue(envelope(partida({ status: 'WALKOVER', winnerId: 'insc-2' })))
    const { user } = monta()

    await user.click(screen.getByRole('checkbox', { name: /Vitória por W.O./ }))
    await user.click(screen.getByRole('radio', { name: /Marcelo Vidal venceu/ }))
    await user.click(screen.getByRole('button', { name: 'Lançar placar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar e lançar' }))

    // O schema da api recusa placar e W.O. no mesmo corpo — ficaria ambíguo.
    await waitFor(() =>
      expect(enviar).toHaveBeenCalledWith('t1', 'div-1', 'm1', { walkoverWinnerId: 'insc-2' }),
    )
  })

  it('marcar W.O. desabilita os campos de placar sem apagar o que foi digitado', async () => {
    const { user } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.click(screen.getByRole('checkbox', { name: /Vitória por W.O./ }))

    expect(screen.getByLabelText('Placar de Juliana Prado')).toBeDisabled()

    // Quem marcou sem querer volta ao que tinha, em vez de redigitar.
    await user.click(screen.getByRole('checkbox', { name: /Vitória por W.O./ }))
    expect(screen.getByLabelText('Placar de Juliana Prado')).toHaveValue(12)
  })

  it('erro da API aparece na tela e devolve a edição', async () => {
    enviar.mockRejectedValueOnce(
      new AxiosError('Request failed', '422', undefined, undefined, {
        status: 422,
        data: { success: false, message: 'A partida ainda não foi marcada.' },
      } as never),
    )

    const { user } = monta()

    await user.type(screen.getByLabelText('Placar de Juliana Prado'), '12')
    await user.type(screen.getByLabelText('Placar de Marcelo Vidal'), '10')
    await user.click(screen.getByRole('button', { name: 'Lançar placar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar e lançar' }))

    // Sai da confirmação de volta para o formulário: insistir no "confirmar"
    // sem poder editar não levaria a lugar nenhum.
    expect(await screen.findByRole('alert')).toHaveTextContent('A partida ainda não foi marcada.')
    expect(screen.getByLabelText('Placar de Juliana Prado')).toBeInTheDocument()
  })
})
