import { useState, useEffect } from 'react'
import type { CompetitionLevel, TournamentDivision } from '../../types/api'
import { getTournamentDivisions } from '../../services/tournaments'
import {
  Wrapper, DivisionTitle, LevelBadge,
  EmptyBracket, LoadingBracket,
} from './styles'

const LEVEL_LABELS: Record<CompetitionLevel, string> = {
  BEGINNER:     'Iniciante',
  INTERMEDIATE: 'Intermediário',
  AMATEUR:      'Amador',
  ADVANCED:     'Avançado',
  PROFESSIONAL: 'Profissional',
}

/**
 * Divisões do torneio, e o aviso de que o chaveamento ainda não existe.
 *
 * Até 15/08 este componente desenhava quartas, semifinal, final e caixa de
 * campeão a partir de uma `buildSimulatedBracket` que inventava os
 * participantes — `Time 1` contra `Time 8`, e assim por diante. Nada daquilo
 * saía de inscrição, porque não existe inscrição: o schema tem `Tournament` e
 * `TournamentDivision`, e mais nada. Ver #256.
 *
 * As divisões continuam aqui porque são dado real, vindo da API. O que saiu foi
 * só o que era inventado — junto com os tipos `BracketTeam`/`BracketMatch`/
 * `BracketRound`, que existiam para descrever o dado falso e não correspondiam
 * a contrato nenhum.
 *
 * O `styles.ts` foi mantido inteiro de propósito: quando o #203 construir
 * partidas de verdade, a parte visual do bracket é reaproveitada a partir dele.
 */
export default function TournamentBracket({ tournamentId }: { tournamentId: string }) {
  const [divisions, setDivisions] = useState<TournamentDivision[]>([])
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
      {divisions.map((division) => (
        <div key={division.id} style={{ marginBottom: '32px' }}>
          <DivisionTitle>
            📌 {division.name}
            {division.level && (
              <LevelBadge style={{ marginLeft: '8px' }}>
                {LEVEL_LABELS[division.level] ?? division.level}
              </LevelBadge>
            )}
          </DivisionTitle>
          <EmptyBracket>
            <span>🏗️</span>
            O chaveamento desta divisão ainda não foi gerado. Ele aparece aqui
            quando as inscrições forem abertas e os confrontos, sorteados.
          </EmptyBracket>
        </div>
      ))}
    </Wrapper>
  )
}
