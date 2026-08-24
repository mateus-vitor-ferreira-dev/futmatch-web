import { useQuery } from '@tanstack/react-query'
import type { EntryRequirementResult, EntryVerdict, PartidaRequirement } from '../../types/api'
import { descreveRequisito } from '../../utils/requisitos'
import { teamsService } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import { Bloco, Titulo, Lista, Item, Marca, Texto, Falta, Etiqueta, ApenasLeitor } from './styles'

interface Props {
  /** As regras da pelada, como vêm na leitura — inclusive para quem não está logado. */
  requirements: PartidaRequirement[]
  /**
   * O veredito, quando há sessão. Sem ele a tela mostra só a barra, sem dizer
   * se o jogador passa — que é exatamente o que o visitante deslogado vê.
   */
  veredito?: EntryVerdict | null
}

/**
 * O que falta para alcançar a regra, quando dá para dizer em número.
 *
 * **Sai do `numeros` da recusa, e nunca da frase.** A API manda `{ exigido,
 * atual }` justamente para a tela não precisar fazer parse da `message` — que
 * quebraria na primeira vez que alguém melhorasse o texto (api#332).
 *
 * Só o de peladas jogadas vira instrução acionável: "faltam 7 peladas" é uma
 * coisa que a pessoa faz. Presença e nota dependem de como ela joga, não de
 * quantas vezes — dizer "faltam 12%" ali soaria como conta, não como caminho.
 */
function oQueFalta(resultado: EntryRequirementResult): string | null {
  const numeros = resultado.failure?.numeros
  if (!numeros) return null

  if (resultado.type === 'MIN_MATCHES_PLAYED') {
    const faltam = Math.max(0, Math.ceil(numeros.exigido - numeros.atual))
    if (faltam === 0) return null
    return faltam === 1 ? 'Falta 1 pelada para você alcançar.' : `Faltam ${faltam} peladas para você alcançar.`
  }

  if (resultado.type === 'MIN_ATTENDANCE_RATE') {
    return `A sua está em ${Math.round(numeros.atual * 100)}%.`
  }

  if (resultado.type === 'MIN_AVERAGE_RATING') {
    return `A sua está em ${numeros.atual.toFixed(1)}.`
  }

  return null
}

/**
 * As regras de entrada da pelada, antes de qualquer clique.
 *
 * Requisito que só aparece como erro depois do clique é uma armadilha: o
 * jogador se anima, clica, toma recusa e não sabe se é regra, defeito ou
 * implicância com ele. Este componente é o que a #230 opõe a isso.
 *
 * **Partida sem requisito não renderiza nada.** A esmagadora maioria continua
 * sem regra nenhuma, e o caso comum não pode ganhar enfeite por causa do raro.
 */
export default function RequisitosDaPartida({ requirements, veredito }: Props) {
  /**
   * O nome do time, quando há requisito de time (api#224).
   *
   * O `params` guarda só o id, e a leitura da pelada não devolve o time. Sem o
   * nome a regra vira "um time que o organizador escolheu", que não é
   * informação nenhuma — e a rota do time é **pública**, então buscá-la não
   * fecha esta tela para quem está deslogado, que é justamente quem ela serve.
   *
   * Enquanto carrega, e se falhar, a frase genérica continua verdadeira.
   */
  const teamId = requirements.find((r) => r.type === 'TEAM_MEMBER')?.params?.teamId
  const { data: time } = useQuery({
    queryKey: chaves.times.porId(teamId ?? ''),
    queryFn: () => teamsService.porId(teamId!),
    enabled: Boolean(teamId),
  })

  if (requirements.length === 0) return null

  const porTipo = new Map(veredito?.requirements.map((r) => [r.type, r]) ?? [])

  return (
    <Bloco data-testid="requisitos-da-pelada">
      <Titulo>Para entrar nesta pelada</Titulo>

      <Lista>
        {requirements.map((requisito) => {
          const resultado = porTipo.get(requisito.type)
          // Sem veredito não há o que dizer sobre este jogador — é o caso do
          // visitante deslogado, e do organizador, que não é avaliado.
          const estado = resultado === undefined ? 'neutro' : resultado.met ? 'ok' : 'falta'
          const falta = resultado && !resultado.met ? oQueFalta(resultado) : null

          return (
            <Item key={requisito.type} $estado={estado}>
              <Marca aria-hidden>{estado === 'ok' ? '✓' : estado === 'falta' ? '✕' : '•'}</Marca>
              <Texto>
                <span>
                  {descreveRequisito(requisito.type, requisito.params, time?.name)}
                  {/* O estado vai no texto também, e não só na cor e no símbolo:
                      leitor de tela não lê cor, e o ✓ pode virar "marca de
                      seleção" sem contexto. */}
                  {estado === 'ok' && <ApenasLeitor> — você atende</ApenasLeitor>}
                  {estado === 'falta' && <ApenasLeitor> — você não atende</ApenasLeitor>}
                </span>
                {falta && <Falta>{falta}</Falta>}
              </Texto>
            </Item>
          )
        })}
      </Lista>
    </Bloco>
  )
}

/**
 * A versão de uma linha, para o card da busca.
 *
 * O card não tem espaço para a lista inteira e não sabe nada sobre quem olha —
 * a busca não consulta o portão por pelada. Ele diz só que existe regra, para
 * a pessoa não abrir a pelada achando que é aberta.
 */
export function EtiquetaDeRequisitos({ requirements }: { requirements: PartidaRequirement[] }) {
  if (requirements.length === 0) return null

  return (
    <Etiqueta data-testid="etiqueta-de-requisitos">
      🔒 {requirements.length === 1 ? '1 requisito para entrar' : `${requirements.length} requisitos para entrar`}
    </Etiqueta>
  )
}
