import api from './api'
import type { ApiEnvelope, CourtType, Pelada, PeladaSearchResult, PeladaStatus } from '../types/api'

/** ⚠️ Devolve o ENVELOPE da API — quem consome escreve `res.data`. */

export interface EventFilters {
  status?: PeladaStatus
  from?: string
  to?: string
  city?: string
  neighborhood?: string
  courtType?: CourtType
  page?: number
  limit?: number
}

export interface CreateEventInput {
  date: string
  maxPlayers: number
  totalValue: number
  pixKey: string
}

export function searchEvents(filters?: EventFilters): Promise<ApiEnvelope<PeladaSearchResult>> {
  return api.get('/events', { params: filters }).then((r) => r.data)
}

export function myCreatedEvents(filters?: EventFilters): Promise<ApiEnvelope<Pelada[]>> {
  return api.get('/events/my/created', { params: filters }).then((r) => r.data)
}

export function myParticipations(filters?: EventFilters): Promise<ApiEnvelope<Pelada[]>> {
  return api.get('/events/my/participating', { params: filters }).then((r) => r.data)
}

export function createEvent(
  courtId: string,
  data: CreateEventInput,
): Promise<ApiEnvelope<Pelada>> {
  return api.post(`/courts/${courtId}/events`, data).then((r) => r.data)
}

export function getEvent(courtId: string, eventId: string): Promise<ApiEnvelope<Pelada>> {
  return api.get(`/courts/${courtId}/events/${eventId}`).then((r) => r.data)
}
