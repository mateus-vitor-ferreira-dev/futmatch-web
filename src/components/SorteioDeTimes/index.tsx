import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import { playerService } from '../../services/playerService'
import { mensagemDeErro } from '../../utils/apiError'
import type { DrawMode, DrawResult, DrawTeam, Pelada } from '../../types/api'
import {
  ModalOverlay, ModalContent, Subtitulo, CampoQuantidade, AcoesDoModal,
  DrawResultHeader, TeamGrid, TeamCard, TeamHeader, PlayerItem,
  TeamVersus, VersusMark, AcoesDoResultado,
  EscolhaDeModo, OpcaoDeModo, ForcaDoTime, ResumoDoEquilibrio,
} from './styles'

const TEAM_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#06b6d4',
]

/** Os dois modos, com a explicação que responde "qual eu escolho?" (#215). */
const MODOS: Array<{ id: DrawMode; titulo: string; explicacao: string }> = [
  { id: 'ALEATORIO', titulo: 'Aleatório', explicacao: 'Puro sorteio, como sempre foi.' },
  { id: 'EQUILIBRADO', titulo: 'Equilibrado', explicacao: 'Usa o nível de cada um para deixar os times parelhos.' },
]

/**
 * Um time do sorteio. Existe para que o layout de confronto (2 times, com o ✕
 * no meio) e a grade (3+ times) montem o mesmo cartão sem duplicar o JSX.
 *
 * O índice do time vai no cabeçalho colorido, junto do nome: é ali que o olho
 * já está quando compara um time com o outro. É a **média por jogador**, e não
 * a soma, porque com times de tamanhos diferentes a soma sempre acusa
 * desequilíbrio — o time com um a menos tem menos gente para somar.
 */
function CartaoDoTime({ time, indice }: { time: DrawTeam; indice: number }) {
  const cor = TEAM_COLORS[indice % TEAM_COLORS.length]

  return (
    <TeamCard $color={cor}>
      <TeamHeader $color={cor}>
        {time.name}
        {time.averageSkill !== undefined && <ForcaDoTime>força {time.averageSkill}</ForcaDoTime>}
      </TeamHeader>
      {time.players.map(p => (
        <PlayerItem key={p.id}>
          <div className="avatar">{p.name?.charAt(0)?.toUpperCase()}</div>
          <span>
            {p.name}
            {p.skill?.estimado && (
              <em title="Nível não declarado — o índice deste jogador é uma estimativa"> · estimado</em>
            )}
          </span>
        </PlayerItem>
      ))}
    </TeamCard>
  )
}

interface SorteioDeTimesProps {
  /** A partida cujos confirmados vão para os times. */
  partida: Pelada
  /** Fecha o modal. Quem renderiza decide o que fazer depois. */
  onClose: () => void
}

/**
 * Modal de sorteio de times: escolhe quantos times e mostra o resultado.
 *
 * Nasceu dentro de "Meus Jogos" e virou componente na #266, quando o detalhe da
 * partida passou a oferecer o sorteio também — que é a tela onde a decisão de
 * sortear naturalmente acontece, porque é ela que lista os confirmados por
 * extenso. Duplicar o modal garantiria que uma das duas cópias ficaria para
 * trás na próxima mudança.
 *
 * O estado do sorteio (quantidade, resultado, carregando) mora aqui dentro. Ele
 * só faz sentido enquanto o modal está aberto, e quem renderiza monta o
 * componente condicionalmente — então cada abertura já começa limpa, sem
 * ninguém precisar lembrar de resetar.
 *
 * O sorteio **não é gravado**: o `drawTeams` da api só lê a partida e devolve o
 * resultado calculado. Fechar o modal descarta o que foi sorteado, e é por isso
 * que não há confirmação a pedir aqui — nem para refazer (#267), que também não
 * destrói nada guardado.
 */
export function SorteioDeTimes({ partida, onClose }: SorteioDeTimesProps) {
  const [teamCount, setTeamCount] = useState(2)
  // O modo vive fora do resultado de propósito: é ele que "Refazer sorteio"
  // reaproveita, e guardá-lo dentro do resultado o perderia a cada rodada.
  const [mode, setMode] = useState<DrawMode>('ALEATORIO')
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [drawLoading, setDrawLoading] = useState(false)

  /**
   * Sorteia — e é a mesma função que refaz.
   *
   * O `drawResult` NÃO é limpo antes da chamada, de propósito: é isso que faz o
   * resultado anterior continuar na tela enquanto o novo não chega, e continuar
   * lá se a chamada falhar. Limpar antes devolveria o organizador ao slider a
   * cada tentativa, que é justo o que a #267 veio tirar do caminho.
   */
  const handleDraw = async () => {
    try {
      setDrawLoading(true)
      const res = await playerService.drawTeams(partida.courtId, partida.id, teamCount, mode)
      setDrawResult(res.data)
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao realizar sorteio. Verifique se há jogadores suficientes.'))
    } finally {
      setDrawLoading(false)
    }
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        {!drawResult ? (
          <>
            <h2>Sortear Times</h2>
            <Subtitulo>
              {partida.court?.place?.name} &mdash; {new Date(partida.date).toLocaleDateString('pt-BR')}
            </Subtitulo>

            <EscolhaDeModo role="radiogroup" aria-label="Modo de sorteio">
              {MODOS.map(opcao => (
                <OpcaoDeModo
                  key={opcao.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === opcao.id}
                  $ativo={mode === opcao.id}
                  disabled={drawLoading}
                  onClick={() => setMode(opcao.id)}
                >
                  <strong>{opcao.titulo}</strong>
                  <span>{opcao.explicacao}</span>
                </OpcaoDeModo>
              ))}
            </EscolhaDeModo>

            <CampoQuantidade>
              <label htmlFor="quantidade-de-times">Quantos times?</label>
              <div className="controle">
                <input
                  id="quantidade-de-times"
                  type="range"
                  min="2"
                  max="10"
                  value={teamCount}
                  onChange={e => setTeamCount(Number(e.target.value))}
                />
                <span className="numero">{teamCount}</span>
              </div>
              <p className="ajuda">
                {mode === 'EQUILIBRADO'
                  ? `Os jogadores serão distribuídos entre ${teamCount} times de força parecida.`
                  : `Os jogadores serão distribuídos aleatoriamente entre ${teamCount} times.`}
              </p>
            </CampoQuantidade>

            <AcoesDoModal>
              <button type="button" className="cancel" onClick={onClose}>Cancelar</button>
              <button
                type="button"
                className="submit"
                onClick={handleDraw}
                disabled={drawLoading}
              >
                {drawLoading ? 'Sorteando...' : '⚽ Sortear!'}
              </button>
            </AcoesDoModal>
          </>
        ) : (
          <>
            <DrawResultHeader>
              <h2>Times Sorteados</h2>
              <p>
                {drawResult.totalPlayers} jogadores distribuídos em {drawResult.teamCount} times
              </p>
            </DrawResultHeader>

            {/*
              Uma lista de nomes não explica nada. O organizador precisa ver o
              quanto ficou parelho para confiar no resultado — ou para decidir
              refazer. E quando alguém entrou sem nível declarado, ele precisa
              saber que parte do equilíbrio é palpite (#215).
            */}
            {drawResult.balance && (
              <ResumoDoEquilibrio $bom={drawResult.balance.withinTarget}>
                <span>
                  {drawResult.balance.spread === 0
                    ? 'Times com a mesma força.'
                    : `Diferença de força entre o time mais forte e o mais fraco: ${drawResult.balance.spread} ponto${drawResult.balance.spread === 1 ? '' : 's'}.`}
                  {!drawResult.balance.withinTarget &&
                    ' Foi o melhor possível com quem confirmou.'}
                </span>
                {drawResult.balance.estimatedPlayers > 0 && (
                  <span className="aviso">
                    {drawResult.balance.estimatedPlayers === 1
                      ? '1 jogador entrou sem nível declarado, e o índice dele é uma estimativa.'
                      : `${drawResult.balance.estimatedPlayers} jogadores entraram sem nível declarado, e os índices deles são estimativas.`}
                  </span>
                )}
              </ResumoDoEquilibrio>
            )}

            {/*
              Dois times viram confronto, com o ✕ no meio. De três em diante
              o ✕ não diria nada, e o resultado continua na grade de sempre.
              O ✕ é irmão dos cartões no grid de três colunas — envolvê-lo
              junto com eles num `div` quebraria o layout.
            */}
            {drawResult.teamCount === 2 ? (
              <TeamVersus>
                <CartaoDoTime time={drawResult.teams[0]} indice={0} />
                <VersusMark aria-hidden="true">✕</VersusMark>
                <CartaoDoTime time={drawResult.teams[1]} indice={1} />
              </TeamVersus>
            ) : (
              <TeamGrid>
                {drawResult.teams.map((time, indice) => (
                  <CartaoDoTime key={indice} time={time} indice={indice} />
                ))}
              </TeamGrid>
            )}

            {/*
              O sorteio é aleatório puro: o back embaralha e distribui em
              rodízio, então os times empatam em NÚMERO e nunca em força. Às
              vezes cai tudo de um lado e o jogo acaba 8x2. Refazer devolve o
              controle ao organizador sem tirar o acaso do meio — e custa uma
              chamada, porque nada é gravado (#267).
            */}
            <AcoesDoResultado>
              <button
                type="button"
                className="refazer"
                onClick={handleDraw}
                disabled={drawLoading}
              >
                <Shuffle size={16} aria-hidden="true" />
                {drawLoading ? 'Sorteando...' : 'Refazer sorteio'}
              </button>
              <button type="button" className="fechar" onClick={onClose}>
                Fechar
              </button>
            </AcoesDoResultado>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  )
}

export default SorteioDeTimes
