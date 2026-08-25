import api from './api'
import type { ApiEnvelope, PartidaInvite } from '../types/api'

/** ⚠️ Devolve o ENVELOPE da API — quem consome escreve `res.data`. */

export interface CriarConviteInput {
  /** Validade. Ausente ou nulo é **sem validade**, e não vencido. */
  expiresAt?: string | null
  /** Limite de entradas. Ausente ou nulo é **sem limite**, e não zero. */
  maxUses?: number | null
}

const rota = (courtId: string, eventId: string) =>
  `/courts/${courtId}/events/${eventId}/invites`

/** Requer ser o organizador da partida, ou ADMIN. */
export function criarConvite(
  courtId: string,
  eventId: string,
  dados: CriarConviteInput = {},
): Promise<ApiEnvelope<PartidaInvite>> {
  return api.post(rota(courtId, eventId), dados).then((r) => r.data)
}

/** Do mais novo para o mais velho — a ordem vem da API. */
export function listarConvites(
  courtId: string,
  eventId: string,
): Promise<ApiEnvelope<PartidaInvite[]>> {
  return api.get(rota(courtId, eventId)).then((r) => r.data)
}

/**
 * Revoga o link. **Não expulsa quem já entrou por ele** — a API é explícita
 * nisso, e é a mesma promessa que a visibilidade e o portão fazem: o jogador
 * combinou de jogar, e mudar a regra depois não desfaz o combinado.
 */
export function revogarConvite(
  courtId: string,
  eventId: string,
  inviteId: string,
): Promise<ApiEnvelope<PartidaInvite>> {
  return api.delete(`${rota(courtId, eventId)}/${inviteId}`).then((r) => r.data)
}
