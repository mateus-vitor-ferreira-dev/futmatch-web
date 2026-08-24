import api from './api'
import type { ApiEnvelope, CourtType, Team, TeamInvite, TeamPelada, TeamSummary } from '../types/api'

/**
 * Times fixos (api#202).
 *
 * `GET /teams/:id` é **pública** — é a página que se manda para quem ainda não
 * tem conta. As peladas do time são rota separada e fechada, de propósito:
 * penduradas na pública, elas publicariam pelada `LINK` e `PRIVATE` de quem
 * estava protegido pela visibilidade.
 */

export interface CriarTimeInput {
  name: string
  sport: CourtType
  city: string
}

export type EditarTimeInput = Partial<CriarTimeInput>

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const teamsService = {
  /** Os times de que o jogador é membro — inclui os que ele capitaneia. */
  meusTimes: () =>
    api.get<ApiEnvelope<TeamSummary[]>>('/users/me/teams').then(desembrulhar),

  /** Pública: responde sem sessão. */
  porId: (teamId: string) =>
    api.get<ApiEnvelope<Team>>(`/teams/${teamId}`).then(desembrulhar),

  criar: (dados: CriarTimeInput) =>
    api.post<ApiEnvelope<Team>>('/teams', dados).then(desembrulhar),

  editar: (teamId: string, dados: EditarTimeInput) =>
    api.patch<ApiEnvelope<Team>>(`/teams/${teamId}`, dados).then(desembrulhar),

  apagar: (teamId: string) => api.delete(`/teams/${teamId}`).then(() => undefined),

  /** Só para quem é do time — fora dele a api responde 403. */
  peladas: (teamId: string) =>
    api.get<ApiEnvelope<TeamPelada[]>>(`/teams/${teamId}/events`).then(desembrulhar),

  /**
   * Convida por e-mail. A api também aceita `userId`, e as duas formas são
   * exclusivas — mandar as duas juntas é 422. Aqui é sempre e-mail porque é o
   * que o capitão tem na mão; o id serviria a um convite disparado do perfil
   * de um jogador, que não existe ainda.
   */
  convidar: (teamId: string, email: string) =>
    api.post<ApiEnvelope<TeamInvite>>(`/teams/${teamId}/invites`, { email }).then(desembrulhar),

  /** Os convites que o jogador ainda não respondeu, vencidos inclusive. */
  meusConvites: () =>
    api.get<ApiEnvelope<TeamInvite[]>>('/users/me/team-invites').then(desembrulhar),

  aceitarConvite: (inviteId: string) =>
    api.patch<ApiEnvelope<TeamInvite>>(`/team-invites/${inviteId}/accept`).then(desembrulhar),

  recusarConvite: (inviteId: string) =>
    api.patch<ApiEnvelope<TeamInvite>>(`/team-invites/${inviteId}/decline`).then(desembrulhar),
}
