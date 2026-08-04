import api from './api'
import type {
  ApiEnvelope,
  DrawResult,
  Participation,
  Pelada,
  PeladaSearchResult,
  PeladaStatus,
  Review,
  UserStats,
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

export const playerService = {
  // --- QUERO JOGAR ---
  searchEvents: async (params?: EventFilters): Promise<ApiEnvelope<PeladaSearchResult>> => {
    const { data } = await api.get('/events', { params })
    return data
  },

  joinEvent: async (courtId: string, eventId: string): Promise<ApiEnvelope<Participation>> => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/participations`
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
  ): Promise<ApiEnvelope<DrawResult>> => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/draw`,
      { teamCount }
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
