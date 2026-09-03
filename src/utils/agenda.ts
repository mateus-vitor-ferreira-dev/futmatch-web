import type { OcupacaoDaQuadra } from '../types/api'

/**
 * As contas da agenda da quadra (api#443), fora de componente e de hook.
 *
 * Elas vivem aqui porque são a metade da funcionalidade que precisa estar
 * certa: mostrar a agenda é conforto, mas **barrar o horário ocupado** é regra,
 * e regra escrita dentro de JSX não se testa sem montar a tela inteira.
 */

const MINUTO_MS = 60_000
const DIA_MS = 24 * 60 * MINUTO_MS

/**
 * A duração que a tela assume quando o campo está vazio.
 *
 * Sessenta, que é o padrão da api (api#445). Duplicado de propósito, e o
 * comentário do `schema` em `CriarPartida` explica o mesmo trato: o formulário
 * precisa do número para desenhar o bloco antes de existir requisição, e a api
 * continua sendo quem decide de verdade.
 */
export const DURACAO_PADRAO_MINUTOS = 60

/**
 * O dia inteiro em que cai um `datetime-local`, em ISO.
 *
 * `datetime-local` entrega hora **local sem fuso** (`2026-09-01T19:00`), e é
 * assim que o `new Date` a interpreta. Os limites do dia saem daí, e não de
 * `toISOString().slice(0, 10)`: quem está em UTC-3 e escolhe 21h de terça
 * pediria a quarta em UTC, e a tela mostraria a agenda do dia errado.
 */
export function limitesDoDia(valorLocal: string): { de: string; ate: string } | null {
  const escolhido = new Date(valorLocal)
  if (Number.isNaN(escolhido.getTime())) return null

  const inicio = new Date(
    escolhido.getFullYear(),
    escolhido.getMonth(),
    escolhido.getDate(),
    0,
    0,
    0,
    0,
  )
  return { de: inicio.toISOString(), ate: new Date(inicio.getTime() + DIA_MS).toISOString() }
}

/** A chave de cache do dia — local, pelo mesmo motivo de `limitesDoDia`. */
export function diaDe(valorLocal: string): string | null {
  const escolhido = new Date(valorLocal)
  if (Number.isNaN(escolhido.getTime())) return null

  const mes = String(escolhido.getMonth() + 1).padStart(2, '0')
  const dia = String(escolhido.getDate()).padStart(2, '0')
  return `${escolhido.getFullYear()}-${mes}-${dia}`
}

export function fimDaPartida(valorLocal: string, duracaoMinutos?: number | null): Date | null {
  const inicio = new Date(valorLocal)
  if (Number.isNaN(inicio.getTime())) return null

  const duracao = duracaoMinutos && duracaoMinutos > 0 ? duracaoMinutos : DURACAO_PADRAO_MINUTOS
  return new Date(inicio.getTime() + duracao * MINUTO_MS)
}

/**
 * A primeira ocupação que atropela este intervalo, ou `null`.
 *
 * **A regra é a mesma da api, de propósito:** `inicio < ocupacao.fim AND fim >
 * ocupacao.inicio`. Encostar na borda não conflita — terminar às 20h e começar
 * às 20h é a marcação normal de quadra cheia, e uma tela mais rígida que a api
 * recusaria na cara do organizador um horário que o servidor aceitaria.
 */
export function conflitoNaAgenda(
  ocupacoes: OcupacaoDaQuadra[],
  inicio: Date,
  fim: Date,
): OcupacaoDaQuadra | null {
  return (
    ocupacoes.find((o) => inicio < new Date(o.fim) && fim > new Date(o.inicio)) ?? null
  )
}

/** `19:00` — a hora local de um instante ISO, para a tela escrever. */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * `das 19:00 às 20:00`.
 *
 * **Sem ressalva, e a ausência dela é a mudança.** Até a api#453 o jogo de
 * campeonato não guardava duração: a api presumia uma hora e marcava a
 * ocupação com `fimPresumido`, para a tela não desenhar um bloco firme sobre um
 * palpite. Agora todo fim é informado, o campo saiu da resposta, e escrever
 * "(fim estimado)" seria ressalvar um dado que não é mais estimativa.
 */
export function faixaDeHorario(ocupacao: OcupacaoDaQuadra): string {
  return `das ${hora(ocupacao.inicio)} às ${hora(ocupacao.fim)}`
}
