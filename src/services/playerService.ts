import api from './api'
import type {
  ApiEnvelope,
  DrawMode,
  DrawResult,
  Participation,
  Pelada,
  PeladaSearchResult,
  PeladaStatus,
  Review,
  UserStats,
  EntryVerdict,
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
  pelada: { id: string; date: string; maxPlayers: number }
  remainingPlayers: number
  leftAt: string
  reason?: string
}

/** Limite do motivo aceito pela API (`leavePeladaSchema`). */
export const MAX_MOTIVO_SAIDA = 200

export const playerService = {
  // --- QUERO JOGAR ---
  searchEvents: async (params?: EventFilters): Promise<ApiEnvelope<PeladaSearchResult>> => {
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
   * está logado lê as regras pelo `requirements` da própria pelada.
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
   * Sai de uma pelada em que o usuário está confirmado.
   *
   * O `reason` é opcional e vai no corpo — a API aceita até 200 caracteres e
   * o devolve na resposta. Quem trata o resto é o backend: recusa sair de
   * pelada finalizada ou cancelada, devolve o evento de FULL para WAITING (é
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
  getMyCreatedEvents: async (params?: EventFilters): Promise<ApiEnvelope<Pelada[]>> => {
    const { data } = await api.get('/events/my/created', { params })
    return data
  },

  getMyParticipatingEvents: async (params?: EventFilters): Promise<ApiEnvelope<Participation[]>> => {
    const { data } = await api.get('/events/my/participating', { params })
    return data
  },

  createEvent: async (courtId: string, payload: CreateEventInput): Promise<ApiEnvelope<Pelada>> => {
    const { data } = await api.post(`/courts/${courtId}/events`, payload)
    return data
  },

  // Busca quadras para o modal de criar jogo
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
  getEvent: async (eventId: string): Promise<ApiEnvelope<Pelada>> => {
    const { data } = await api.get(`/events/${eventId}`)
    return data
  },

  // --- STATUS DO EVENTO (organizador) ---
  updateEventStatus: async (
    courtId: string,
    eventId: string,
    status: PeladaStatus,
  ): Promise<ApiEnvelope<Pelada>> => {
    const { data } = await api.patch(
      `/courts/${courtId}/events/${eventId}/status`,
      { status }
    )
    return data
  },
}
