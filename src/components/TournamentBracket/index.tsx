import { useState, useEffect } from 'react'
import type {
  CompetitionLevel,
  TournamentDivision,
  TournamentMatch,
  TournamentMatchSide,
} from '../../types/api'
import { getTournamentDivisions, getDivisionMatches } from '../../services/tournaments'
import {
  Wrapper, DivisionTitle, LevelBadge,
  EmptyBracket, LoadingBracket,
  BracketGrid, Round, RoundLabel, MatchesColumn, MatchCard,
  TeamRow, TeamName, Score, StatusTag, MatchMeta, Connector,
} from './styles'

const LEVEL_LABELS: Record<CompetitionLevel, string> = {
  BEGINNER:     'Iniciante',
  INTERMEDIATE: 'Intermediário',
  AMATEUR:      'Amador',
  ADVANCED:     'Avançado',
  PROFESSIONAL: 'Profissional',
}

/**
 * Nome da fase, contado de trás para frente: a última rodada é sempre a final,
 * a penúltima a semifinal, e assim por diante.
 *
 * Contar assim, e não pelo número de inscritos, é o que faz a chave de 4 e a de
 * 32 nomearem certo sem ninguém configurar nada. Passando de oitavas o nome
 * deixa de ajudar — "16 avos" não diz mais que "1ª rodada" — e aí o número volta.
 */
const FASES_FINAIS = ['Final', 'Semifinal', 'Quartas de final', 'Oitavas de final']

function rotuloDaFase(round: number, totalDeRodadas: number): string {
  return FASES_FINAIS[totalDeRodadas - round] ?? `${round}ª rodada`
}

/**
 * Agrupa as partidas por rodada **preservando a ordem que veio da API**.
 *
 * A API garante `round` e depois `orderInRound` (o repositório ordena, e o
 * comentário de lá diz que é para os consumidores não precisarem). Reordenar
 * aqui duplicaria essa garantia em dois lugares que podem discordar — e a chave
 * sairia desenhada diferente conforme quem estivesse certo.
 */
function agruparPorRodada(partidas: TournamentMatch[]): TournamentMatch[][] {
  const porRodada = new Map<number, TournamentMatch[]>()

  for (const partida of partidas) {
    const daRodada = porRodada.get(partida.round)
    if (daRodada) daRodada.push(partida)
    else porRodada.set(partida.round, [partida])
  }

  return [...porRodada.values()]
}

const formatarQuando = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))

/**
 * Um lado do confronto.
 *
 * Sem participante a linha continua existindo, escrita como "A definir": a
 * partida está na chave e o lugar é dela — some-la faria um cartão de uma linha
 * só, que parece defeito. É o mesmo motivo de `TeamName` ter o `$empty`.
 *
 * O placar só aparece quando existe. `0` é um placar de verdade, e mostrar zero
 * numa partida que não começou seria inventar um resultado.
 */
function LadoDoConfronto({
  lado, placar, venceu,
}: {
  lado: TournamentMatchSide | null
  placar: number | null
  venceu: boolean
}) {
  return (
    <TeamRow $winner={venceu}>
      <TeamName $empty={!lado} $winner={venceu}>
        {lado ? lado.user.name : 'A definir'}
      </TeamName>
      {placar !== null && <Score $winner={venceu}>{placar}</Score>}
    </TeamRow>
  )
}

function CartaoDoConfronto({ partida }: { partida: TournamentMatch }) {
  // Comparado por id de INSCRIÇÃO, e não de usuário: é a inscrição que a
  // partida referencia, e a mesma pessoa pode estar inscrita em duas divisões.
  const venceuA = partida.winnerId !== null && partida.winnerId === partida.participantAId
  const venceuB = partida.winnerId !== null && partida.winnerId === partida.participantBId

  const detalhes = [
    partida.court?.name,
    partida.scheduledAt && formatarQuando(partida.scheduledAt),
    partida.referee && `árb. ${partida.referee.name}`,
  ].filter(Boolean) as string[]

  const temRodape = partida.status === 'IN_PROGRESS' || partida.status === 'WALKOVER' || detalhes.length > 0

  return (
    <MatchCard>
      <LadoDoConfronto lado={partida.participantA} placar={partida.scoreA} venceu={venceuA} />
      <LadoDoConfronto lado={partida.participantB} placar={partida.scoreB} venceu={venceuB} />

      {temRodape && (
        <MatchMeta>
          {partida.status === 'IN_PROGRESS' && <StatusTag $tone="live">Em andamento</StatusTag>}
          {/* W.O. é vitória sem jogo: não há placar para explicar o vencedor
              destacado acima, então a etiqueta é o que explica. */}
          {partida.status === 'WALKOVER' && <StatusTag $tone="wo">W.O.</StatusTag>}
          {detalhes.join(' · ')}
        </MatchMeta>
      )}
    </MatchCard>
  )
}

/**
 * O chaveamento do torneio, divisão por divisão.
 *
 * Até 15/08 este componente desenhava quartas, semifinal, final e caixa de
 * campeão a partir de uma `buildSimulatedBracket` que inventava os
 * participantes — `Time 1` contra `Time 8`, e assim por diante. Nada daquilo
 * saía de inscrição, porque não existia inscrição. Ver #256.
 *
 * Agora sai: `TournamentMatch` existe na API, e cada confronto aqui é uma
 * partida de verdade, com participantes que são inscrições de verdade. **O que
 * não mudou é a regra** — nada com cara de participante aparece na tela sem ter
 * vindo da API. Divisão sem chave continua dizendo que não tem chave, em vez de
 * simular uma.
 */
export default function TournamentBracket({ tournamentId }: { tournamentId: string }) {
  const [divisions, setDivisions] = useState<TournamentDivision[]>([])
  const [chavePorDivisao, setChavePorDivisao] = useState<Record<string, TournamentMatch[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return

    // O efeito virou duas etapas encadeadas (divisões, depois a chave de cada
    // uma). Sem esta trava, trocar de torneio no meio do caminho deixaria a
    // resposta do torneio antigo chegar depois e sobrescrever a do novo.
    let cancelado = false
    setLoading(true)

    getTournamentDivisions(tournamentId)
      .then(async (res) => {
        const lista = Array.isArray(res.data) ? res.data : []
        if (cancelado) return
        setDivisions(lista)

        // Uma requisição por divisão, em paralelo. O `catch` é **por divisão**:
        // a chave de uma não depende da outra, e uma que falhe não pode levar
        // junto as que responderam.
        const chaves = await Promise.all(
          lista.map((division) =>
            getDivisionMatches(tournamentId, division.id)
              .then((r) => [division.id, Array.isArray(r.data) ? r.data : []] as const)
              .catch(() => [division.id, [] as TournamentMatch[]] as const),
          ),
        )

        if (cancelado) return
        setChavePorDivisao(Object.fromEntries(chaves))
      })
      .catch(() => {
        if (cancelado) return
        setDivisions([])
        setChavePorDivisao({})
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })

    return () => { cancelado = true }
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
        const rodadas = agruparPorRodada(chavePorDivisao[division.id] ?? [])

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

            {rodadas.length === 0 ? (
              <EmptyBracket>
                <span>🏗️</span>
                O chaveamento desta divisão ainda não foi gerado. Ele aparece aqui
                quando as inscrições forem abertas e os confrontos, sorteados.
              </EmptyBracket>
            ) : (
              <BracketGrid>
                {rodadas.map((partidas, indice) => (
                  <Round key={partidas[0].round}>
                    <RoundLabel>{rotuloDaFase(partidas[0].round, rodadas.length)}</RoundLabel>
                    {/* O espaçamento dobra a cada rodada para os confrontos
                        ficarem na altura de quem os alimenta — é a forma de
                        bracket, e é para isso que `MatchesColumn` tem o `$gap`. */}
                    <MatchesColumn $gap={`${16 * 2 ** indice}px`}>
                      {partidas.map((partida) => (
                        <CartaoDoConfronto key={partida.id} partida={partida} />
                      ))}
                    </MatchesColumn>
                  </Round>
                ))}
                {rodadas.length > 1 && <Connector aria-hidden>›</Connector>}
              </BracketGrid>
            )}
          </div>
        )
      })}
    </Wrapper>
  )
}
