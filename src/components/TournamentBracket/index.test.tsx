/**
 * O chaveamento não pode inventar participante.
 *
 * Até 15/08 este componente desenhava um bracket inteiro a partir de uma
 * `buildSimulatedBracket`, que gerava `Time 1` … `Time 8` do nada e montava
 * quartas, semifinal e final com esses nomes. O dono via um confronto que nunca
 * foi sorteado, porque não existe inscrição no sistema. Ver #256.
 *
 * O teste central aqui é o negativo: **nada com cara de participante aparece na
 * tela sem ter vindo da API**. É ele que cai se alguém trouxer a simulação de
 * volta, por saudade do visual.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import TournamentBracket from './index'
import type { TournamentDivision } from '../../types/api'

vi.mock('../../services/tournaments')

import { getTournamentDivisions } from '../../services/tournaments'

const buscaDivisoes = vi.mocked(getTournamentDivisions)

function divisao(over: Partial<TournamentDivision> = {}): TournamentDivision {
  return {
    id: 'div-1',
    tournamentId: 'torneio-1',
    name: 'Masculino A',
    description: null,
    genderRestriction: null,
    ageRestriction: null,
    level: 'AMATEUR',
    minPlayersPerTeam: 1,
    maxPlayersPerTeam: 2,
    // 8 vagas era exatamente o que fazia a simulação montar quartas de final.
    maxParticipants: 8,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  buscaDivisoes.mockResolvedValue({ success: true, data: [] })
})

describe('TournamentBracket', () => {
  it('não inventa participante nenhum quando a divisão tem vagas', async () => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText(/Masculino A/)
    // Os nomes que a simulação gerava. Nenhum deles saía da API.
    expect(screen.queryByText(/Time \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/A definir/)).not.toBeInTheDocument()
    // As fases que ela montava, e a caixa de campeão.
    expect(screen.queryByText(/Quartas de Final/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Semifinal/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Final/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Campeão/)).not.toBeInTheDocument()
  })

  it('mostra a divisão com nome e nível, que são dado real da API', async () => {
    buscaDivisoes.mockResolvedValue({
      success: true,
      data: [divisao({ name: 'Feminino B', level: 'ADVANCED' })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText(/Feminino B/)).toBeInTheDocument()
    expect(screen.getByText('Avançado')).toBeInTheDocument()
  })

  it('diz que o chaveamento ainda não existe, uma vez por divisão', async () => {
    buscaDivisoes.mockResolvedValue({
      success: true,
      data: [divisao(), divisao({ id: 'div-2', name: 'Feminino B' })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText(/Masculino A/)
    expect(screen.getAllByText(/ainda não foi gerado/)).toHaveLength(2)
  })

  it('mantém o estado vazio quando o torneio não tem divisão', async () => {
    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(
      await screen.findByText(/O chaveamento ainda não foi gerado para este torneio/),
    ).toBeInTheDocument()
  })

  it('não quebra quando a API falha — cai no estado vazio', async () => {
    buscaDivisoes.mockRejectedValue(new Error('fora do ar'))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(
      await screen.findByText(/O chaveamento ainda não foi gerado para este torneio/),
    ).toBeInTheDocument()
  })

  it('não busca nada sem tournamentId', async () => {
    renderWithProviders(<TournamentBracket tournamentId="" />)

    await waitFor(() => expect(buscaDivisoes).not.toHaveBeenCalled())
  })
})
