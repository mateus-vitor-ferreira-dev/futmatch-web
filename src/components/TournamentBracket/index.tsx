import { useState, useEffect } from 'react'
import type {
  CompetitionLevel,
  TournamentDivision,
  TournamentMatch,
  TournamentMatchSide,
} from '../../types/api'
import { getTournamentDivisions, getDivisionMatches } from '../../services/tournaments'
import LancarPlacar from '../LancarPlacar'
import {
  Wrapper, DivisionTitle, LevelBadge,
  EmptyBracket, LoadingBracket,
  BracketGrid, Round, RoundLabel, MatchesColumn, MatchSlot, MatchCard,
  TeamRow, TeamName, Score, StatusTag, MatchMeta, Connector, BotaoDeResultado,
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

/**
 * As faixas verticais de uma rodada — uma por vaga da chave, na ordem.
 *
 * Da segunda rodada em diante a resposta é trivial: a API cria essas rodadas
 * **inteiras e vazias**, então vaga e partida são a mesma coisa e cada faixa
 * tem exatamente um confronto.
 *
 * A primeira rodada é o caso torto, e é o motivo desta função existir. A
 * `bracket.ts` não cria a partida de bye — quem passa direto já nasce dentro da
 * vaga da segunda rodada, de propósito, para a tela não desenhar um jogo que
 * ninguém jogou. O efeito colateral é que a primeira rodada tem MENOS partidas
 * que vagas, e as que sobraram vêm renumeradas de 1 em diante: o `orderInRound`
 * delas não diz mais em que altura da chave elas estão.
 *
 * Quem sabe dizer é o `nextMatchId`. Montamos a coluna a partir das vagas da
 * SEGUNDA rodada, e não da lista de partidas: cada faixa é uma vaga de destino,
 * e dentro dela vão os confrontos que a alimentam — dois no caso comum, um
 * quando o outro lado veio de bye, nenhum quando os dois vieram. A faixa vazia
 * é o que mantém o resto na altura certa; sem ela, a chave inteira escorrega
 * para cima a partir do primeiro bye.
 */
function faixasDaRodada(rodadas: TournamentMatch[][], indice: number): TournamentMatch[][] {
  const daRodada = rodadas[indice]

  // Chave de dois inscritos: uma rodada só, que já é a final. Não há segunda
  // rodada de onde tirar vaga, e também não há bye possível.
  if (indice > 0 || rodadas.length === 1) return daRodada.map((partida) => [partida])

  const proximaRodada = rodadas[1]
  const porDestino = new Map<string, TournamentMatch[]>()

  for (const partida of daRodada) {
    if (!partida.nextMatchId) continue
    const irmas = porDestino.get(partida.nextMatchId)
    if (irmas) irmas.push(partida)
    else porDestino.set(partida.nextMatchId, [partida])
  }

  const faixas = proximaRodada.map((destino) => porDestino.get(destino.id) ?? [])

  // Rede: partida da primeira rodada que não achou destino continua na tela, em
  // faixa própria. Some-la seria esconder um confronto real por causa de um dado
  // inesperado — a chave sai torta, mas ninguém deixa de ver o jogo.
  const acomodadas = new Set(faixas.flat().map((p) => p.id))
  for (const partida of daRodada) {
    if (!acomodadas.has(partida.id)) faixas.push([partida])
  }

  return faixas
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

function CartaoDoConfronto({
  partida, tournamentId, podeLancar, onLancado,
}: {
  partida: TournamentMatch
  tournamentId: string
  /**
   * Se quem olha pode lançar o resultado desta partida.
   *
   * Vem da página, que descobre isso do mesmo jeito que o painel de inscrições:
   * **pelo 403**. A regra de quem gerencia mora na API e não é reproduzível
   * aqui — o `place` que vem no torneio não traz `ownerId`. Ver a #259.
   */
  podeLancar?: boolean
  onLancado?: (atualizada: TournamentMatch) => void
}) {
  const [lancando, setLancando] = useState(false)
  // Comparado por id de INSCRIÇÃO, e não de usuário: é a inscrição que a
  // partida referencia, e a mesma pessoa pode estar inscrita em duas divisões.
  const venceuA = partida.winnerId !== null && partida.winnerId === partida.participantAId
  const venceuB = partida.winnerId !== null && partida.winnerId === partida.participantBId

  const detalhes = [
    partida.court?.name,
    partida.scheduledAt && formatarQuando(partida.scheduledAt),
    partida.referee && `árb. ${partida.referee.name}`,
  ].filter(Boolean) as string[]

  const encerrada = partida.status === 'FINISHED' || partida.status === 'WALKOVER'
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

      {/*
        * Quem organiza lança o placar por aqui (#261). A API permite porque
        * árbitro falta — e um campeonato sem árbitro designado não teria como
        * fechar partida nenhuma pelo app.
        *
        * Só aparece na partida que ainda não terminou e que já tem os dois
        * lados: nas outras o formulário seria um 422 esperando o clique.
        */}
      {podeLancar && !encerrada && partida.participantAId && partida.participantBId && (
        <MatchMeta>
          {lancando ? (
            <LancarPlacar
              tournamentId={tournamentId}
              divisionId={partida.divisionId}
              match={partida}
              onLancado={(atualizada) => { setLancando(false); onLancado?.(atualizada) }}
              onCancelar={() => setLancando(false)}
            />
          ) : (
            <BotaoDeResultado type="button" onClick={() => setLancando(true)}>
              Lançar placar
            </BotaoDeResultado>
          )}
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
export default function TournamentBracket({
  tournamentId, podeLancar,
}: {
  tournamentId: string
  /** Quem gerencia o campeonato lança placar pelos cartões — ver #261. */
  podeLancar?: boolean
}) {
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
                  <Round key={partidas[0].round} data-testid="rodada-da-chave">
                    <RoundLabel>{rotuloDaFase(partidas[0].round, rodadas.length)}</RoundLabel>
                    {/* Uma faixa por vaga da chave, todas com o mesmo peso. A
                        altura de cada confronto sai daí, e não de um gap
                        calculado — ver `faixasDaRodada`. */}
                    <MatchesColumn>
                      {faixasDaRodada(rodadas, indice).map((faixa, posicao) => (
                        <MatchSlot key={faixa[0]?.id ?? `vazia-${posicao}`} data-testid="faixa-da-chave">
                          {faixa.map((partida) => (
                            <CartaoDoConfronto
                              key={partida.id}
                              partida={partida}
                              tournamentId={tournamentId}
                              podeLancar={podeLancar}
                              onLancado={(atualizada) =>
                                setChavePorDivisao((atual) => ({
                                  ...atual,
                                  [division.id]: (atual[division.id] ?? []).map((p) =>
                                    p.id === atualizada.id ? { ...p, ...atualizada } : p,
                                  ),
                                }))
                              }
                            />
                          ))}
                        </MatchSlot>
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
