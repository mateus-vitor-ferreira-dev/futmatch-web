import { useState, useEffect } from 'react'
import { getTournamentDivisions } from '../../services/tournaments'
import {
  Wrapper, BracketGrid, Round, RoundLabel, MatchesColumn,
  MatchCard, TeamRow, TeamName, Connector,
  DivisionTitle, LevelBadge,
  EmptyBracket, LoadingBracket,
} from './styles'

const LEVEL_LABELS = {
  BEGINNER:     'Iniciante',
  INTERMEDIATE: 'Intermediário',
  AMATEUR:      'Amador',
  ADVANCED:     'Avançado',
  PROFESSIONAL: 'Profissional',
}

/**
 * Gera um bracket visual simulado a partir das divisões do torneio.
 * Quando a API tiver partidas reais, substitua essa função pelos dados da API.
 */
function buildSimulatedBracket(division) {
  const max = division.maxParticipants || 8
  const teamCount = Math.min(max, 8)
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    id:   `team-${i + 1}`,
    name: `Time ${i + 1}`,
  }))

  const rounds = []

  // Quartas de final (4 jogos = 8 times)
  if (teamCount >= 8) {
    rounds.push({
      id:    'qf',
      label: 'Quartas de Final',
      matches: [
        { id: 'qf1', teamA: teams[0], teamB: teams[7] },
        { id: 'qf2', teamA: teams[3], teamB: teams[4] },
        { id: 'qf3', teamA: teams[1], teamB: teams[6] },
        { id: 'qf4', teamA: teams[2], teamB: teams[5] },
      ],
    })
  }

  // Semifinal (2 jogos = 4 times)
  if (teamCount >= 4) {
    rounds.push({
      id:    'sf',
      label: 'Semifinal',
      matches: [
        { id: 'sf1', teamA: { id: 'tbd', name: 'A definir' }, teamB: { id: 'tbd2', name: 'A definir' } },
        { id: 'sf2', teamA: { id: 'tbd3', name: 'A definir' }, teamB: { id: 'tbd4', name: 'A definir' } },
      ],
    })
  }

  // Final
  rounds.push({
    id:    'final',
    label: 'Final',
    matches: [
      { id: 'final1', teamA: { id: 'tbd5', name: 'A definir' }, teamB: { id: 'tbd6', name: 'A definir' } },
    ],
  })

  return rounds
}

const GAP_BY_ROUND = ['16px', '80px', '176px', '360px']

function BracketRounds({ rounds }) {
  if (!rounds || rounds.length === 0) return null

  return (
    <BracketGrid>
      {rounds.map((round, roundIndex) => (
        <div key={round.id} style={{ display: 'flex', alignItems: 'center' }}>
          <Round>
            <RoundLabel>{round.label}</RoundLabel>
            <MatchesColumn $gap={GAP_BY_ROUND[roundIndex] ?? '16px'}>
              {round.matches.map((match) => (
                <MatchCard key={match.id}>
                  <TeamRow $winner={false}>
                    <TeamName $empty={match.teamA?.name === 'A definir'}>
                      {match.teamA?.name || 'A definir'}
                    </TeamName>
                  </TeamRow>
                  <TeamRow $winner={false}>
                    <TeamName $empty={match.teamB?.name === 'A definir'}>
                      {match.teamB?.name || 'A definir'}
                    </TeamName>
                  </TeamRow>
                </MatchCard>
              ))}
            </MatchesColumn>
          </Round>

          {roundIndex < rounds.length - 1 && (
            <Connector>›</Connector>
          )}
        </div>
      ))}

      {/* Caixa do campeão */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Connector>›</Connector>
        <MatchCard style={{ minWidth: '140px' }}>
          <TeamRow>
            <TeamName style={{ textAlign: 'center', width: '100%' }}>
              🏆 Campeão
            </TeamName>
          </TeamRow>
          <TeamRow>
            <TeamName $empty style={{ textAlign: 'center', width: '100%' }}>
              A definir
            </TeamName>
          </TeamRow>
        </MatchCard>
      </div>
    </BracketGrid>
  )
}

/**
 * Componente de chaveamento de torneio.
 * Busca as divisões do torneio pela API e gera o bracket visual.
 *
 * @param {{ tournamentId: string }} props
 */
export default function TournamentBracket({ tournamentId }) {
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    setLoading(true)
    getTournamentDivisions(tournamentId)
      .then((res) => setDivisions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDivisions([]))
      .finally(() => setLoading(false))
  }, [tournamentId])

  if (loading) {
    return <LoadingBracket>Carregando chaveamento...</LoadingBracket>
  }

  if (divisions.length === 0) {
    return (
      <EmptyBracket>
        <span>🏗️</span>
        O chaveamento ainda não foi gerado para este torneio.
      </EmptyBracket>
    )
  }

  return (
    <Wrapper>
      {divisions.map((division) => {
        const rounds = buildSimulatedBracket(division)
        return (
          <div key={division.id} style={{ marginBottom: '32px' }}>
            <DivisionTitle>
              📌 {division.name}
              {division.level && (
                <LevelBadge style={{ marginLeft: '8px' }}>
                  {LEVEL_LABELS[division.level] ?? division.level}
                </LevelBadge>
              )}
            </DivisionTitle>
            <BracketRounds rounds={rounds} />
          </div>
        )
      })}
    </Wrapper>
  )
}