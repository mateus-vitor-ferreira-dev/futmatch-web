import api from './api'
import type {
  ApiEnvelope,
  DrawMode,
  DrawResult,
  Participation,
  Partida,
  PartidaSearchResult,
  PartidaStatus,
  Review,
  UserStats,
  EntryVerdict,
  PartidaRequirement,
  PartidaRequirementParams,
  PartidaRequirementType,
  PartidaVisibility,
} from '../types/api'
import type { CourtFilters } from './courts'
import type { Court } from '../types/api'
import type { CreateEventInput, EventFilters } from './events'

/**
 * ⚠️ Convenção deste arquivo: desestrutura `{ data }` da resposta axios, então
 * devolve o ENVELOPE (`{ success, data }`) — igual a events.ts/courts.ts.
 * Quem consome escreve `res.data`.
 */

export interface ReviewInput {
  reviewedId: string
  stars: number
  tag: string
  comment?: string | null
}

export interface ReviewProgress {
  total: number
  reviewed: number
  pending: number
  completed: boolean
}

/** Retorno de `DELETE .../participations` — o que a API devolve ao sair. */
export interface LeaveResult {
  partida: { id: string; date: string; maxPlayers: number }
  remainingPlayers: number
  leftAt: string
  reason?: string
}

/** Limite do motivo aceito pela API (`leavePartidaSchema`). */
export const MAX_MOTIVO_SAIDA = 200

export const playerService = {
  // --- QUERO JOGAR ---
  searchEvents: async (params?: EventFilters): Promise<ApiEnvelope<PartidaSearchResult>> => {
    const { data } = await api.get('/events', { params })
    return data
  },

  /**
   * Pergunta se o usuário logado pode entrar — **sem tentar entrar**.
   *
   * Responde 200 inclusive quando a resposta é não: `allowed: false` com a
   * lista de motivos é uma resposta bem-sucedida à pergunta feita. É esta rota
   * que evita a armadilha de o jogador só descobrir a regra tomando erro
   * depois do clique.
   *
   * Exige sessão, porque a resposta é sobre um jogador específico. Quem não
   * está logado lê as regras pelo `requirements` da própria partida.
   */
  checkEntry: async (courtId: string, eventId: string): Promise<ApiEnvelope<EntryVerdict>> => {
    const { data } = await api.get(
      `/courts/${courtId}/events/${eventId}/participations/entry`
    )
    return data
  },

  joinEvent: async (courtId: string, eventId: string): Promise<ApiEnvelope<Participation>> => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/participations`
    )
    return data
  },

  /**
   * Sai de uma partida em que o usuário está confirmado.
   *
   * O `reason` é opcional e vai no corpo — a API aceita até 200 caracteres e
   * o devolve na resposta. Quem trata o resto é o backend: recusa sair de
   * partida finalizada ou cancelada, devolve o evento de FULL para WAITING (é
   * o que faz a vaga voltar para a busca) e notifica o organizador.
   */
  leaveEvent: async (
    courtId: string,
    eventId: string,
    reason?: string,
  ): Promise<ApiEnvelope<LeaveResult>> => {
    const { data } = await api.delete(
      `/courts/${courtId}/events/${eventId}/participations`,
      { data: reason ? { reason } : {} }
    )
    return data
  },

  // --- MEUS JOGOS ---
  getMyCreatedEvents: async (params?: EventFilters): Promise<ApiEnvelope<Partida[]>> => {
    const { data } = await api.get('/events/my/created', { params })
    return data
  },

  getMyParticipatingEvents: async (params?: EventFilters): Promise<ApiEnvelope<Participation[]>> => {
    const { data } = await api.get('/events/my/participating', { params })
    return data
  },

  createEvent: async (courtId: string, payload: CreateEventInput): Promise<ApiEnvelope<Partida>> => {
    const { data } = await api.post(`/courts/${courtId}/events`, payload)
    return data
  },

  // Busca quadras para o modal de criar partida
  getCourts: async (params?: CourtFilters): Promise<ApiEnvelope<Court[]>> => {
    const { data } = await api.get('/courts', { params })
    return data
  },

  // --- HISTÓRICO E AVALIAÇÕES ---
  getUserReviews: async (
    userId: string,
  ): Promise<ApiEnvelope<{ summary: UserStats; reviews: Review[] }>> => {
    const { data } = await api.get(`/users/${userId}/reviews`)
    return data
  },

  getUserReviewsGiven: async (userId: string): Promise<ApiEnvelope<Review[]>> => {
    const { data } = await api.get(`/users/${userId}/reviews/given`)
    return data
  },

  getEventParticipants: async (
    courtId: string,
    eventId: string,
  ): Promise<ApiEnvelope<Participation[]>> => {
    const { data } = await api.get(
      `/courts/${courtId}/events/${eventId}/participations`
    )
    return data
  },

  submitReview: async (
    courtId: string,
    eventId: string,
    payload: ReviewInput,
  ): Promise<ApiEnvelope<Review>> => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/reviews`,
      payload
    )
    return data
  },

  getReviewProgress: async (
    courtId: string,
    eventId: string,
  ): Promise<ApiEnvelope<ReviewProgress>> => {
    const { data } = await api.get(
      `/courts/${courtId}/events/${eventId}/reviews/progress`
    )
    return data
  },

  // --- PRESENÇA ---
  confirmAttendance: async (
    courtId: string,
    eventId: string,
    userId: string,
    attended: boolean,
  ): Promise<ApiEnvelope<Participation>> => {
    const { data } = await api.patch(
      `/courts/${courtId}/events/${eventId}/participations/${userId}/attendance`,
      { attended }
    )
    return data
  },

  // --- SORTEIO ---
  drawTeams: async (
    courtId: string,
    eventId: string,
    teamCount: number,
    // O padrão espelha o da API: quem não escolhe modo recebe o sorteio de
    // sempre. Deixar o front decidir outro padrão faria as duas pontas
    // discordarem sobre o que "não mandei nada" significa.
    mode: DrawMode = 'ALEATORIO',
  ): Promise<ApiEnvelope<DrawResult>> => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/draw`,
      { teamCount, mode }
    )
    return data
  },

  // --- DETALHE DE EVENTO ---
  /**
   * O detalhe da partida, com ou sem sessão.
   *
   * `convite` é o token do link (api#225). Vai como query, e só quando existe:
   * é ele que abre a partida `BY_LINK` ou `PRIVATE` para quem não chegaria nela
   * de outro jeito — inclusive para quem ainda não tem conta, que é a razão de
   * o convite existir.
   */
  getEvent: async (eventId: string, convite?: string): Promise<ApiEnvelope<Partida>> => {
    const { data } = await api.get(`/events/${eventId}`, {
      params: convite ? { convite } : undefined,
    })
    return data
  },

  // --- REGRAS DE ACESSO DA PELADA (organizador) ---

  /**
   * A visibilidade, no `PATCH` da própria partida (api#220).
   *
   * Os requisitos são rotas separadas porque são uma coleção, e não um campo:
   * cada tipo entra e sai sozinho. Trocar a visibilidade não mexe em requisito
   * nenhum, e vice-versa — os dois eixos são independentes de propósito.
   */
  updateEventVisibility: async (
    courtId: string,
    eventId: string,
    visibility: PartidaVisibility,
  ): Promise<ApiEnvelope<Partida>> => {
    const { data } = await api.patch(`/courts/${courtId}/events/${eventId}`, { visibility })
    return data
  },

  /** Só o organizador lê a lista completa — a API responde 403 para o resto. */
  listRequirements: async (
    courtId: string,
    eventId: string,
  ): Promise<ApiEnvelope<PartidaRequirement[]>> => {
    const { data } = await api.get(`/courts/${courtId}/events/${eventId}/requirements`)
    return data
  },

  /**
   * Anexa ou substitui um requisito. Um por tipo, e reenviar o mesmo substitui.
   *
   * Param impossível de cumprir volta 422 com `REQUIREMENT_PARAMS_INVALID` —
   * nota mínima 6 numa escala de 5, time que não existe. O erro é da
   * configuração, e é aqui que ele precisa aparecer.
   */
  upsertRequirement: async (
    courtId: string,
    eventId: string,
    type: PartidaRequirementType,
    params: PartidaRequirementParams,
  ): Promise<ApiEnvelope<PartidaRequirement>> => {
    const { data } = await api.put(
      `/courts/${courtId}/events/${eventId}/requirements/${type}`,
      { params },
    )
    return data
  },

  deleteRequirement: async (
    courtId: string,
    eventId: string,
    type: PartidaRequirementType,
  ): Promise<void> => {
    await api.delete(`/courts/${courtId}/events/${eventId}/requirements/${type}`)
  },

  // --- STATUS DO EVENTO (organizador) ---
  updateEventStatus: async (
    courtId: string,
    eventId: string,
    status: PartidaStatus,
  ): Promise<ApiEnvelope<Partida>> => {
    const { data } = await api.patch(
      `/courts/${courtId}/events/${eventId}/status`,
      { status }
    )
    return data
  },
}
