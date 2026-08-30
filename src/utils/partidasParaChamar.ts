import type { Partida } from '../types/api'

/**
 * Uma partida para a qual ainda faz sentido chamar alguém (#380).
 *
 * As três condições são as que a pessoa checaria no olho antes de mandar o
 * link, e ficam no cliente porque `GET /events/my/created` devolve o histórico
 * inteiro: oferecer a partida de terça passada seria oferecer um convite que
 * não leva a lugar nenhum.
 */
export function podeReceberGente(partida: Partida, agora = Date.now()): boolean {
  if (partida.status === 'CANCELLED' || partida.status === 'FINISHED') return false

  /**
   * O **fim**, e não o começo.
   *
   * Uma partida que começou às 19h e acaba às 21h ainda aceita gente às 19h30 —
   * é o atrasado que chega no segundo tempo, e cortar pelo `date` o deixaria de
   * fora. É para isso que o `endsAt` da api#445 existe; antes dela não havia
   * como fazer esta conta.
   */
  if (new Date(partida.endsAt).getTime() <= agora) return false

  return (partida._count?.participations ?? 0) < partida.maxPlayers
}
