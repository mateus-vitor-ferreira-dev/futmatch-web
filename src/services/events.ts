import api from './api'
import type {
  ApiEnvelope,
  CourtType,
  Pelada,
  PeladaSearchResult,
  PeladaStatus,
  PeladaVisibility,
  Recomendacoes,
} from '../types/api'

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
  /**
   * A busca por raio (api#216). Os três andam juntos: **`radiusKm` sem o ponto
   * de origem é recusado com 422**, e não ignorado — ignorar devolveria a busca
   * inteira com cara de ter respeitado o raio.
   *
   * Com eles, a resposta vem ordenada por distância e cada pelada traz o
   * `distanceKm`.
   */
  latitude?: number
  longitude?: number
  radiusKm?: number
}

export interface CreateEventInput {
  date: string
  maxPlayers: number
  totalValue: number
  pixKey: string
  /** Omitido, a API grava `PUBLIC` — o comportamento que existia antes do campo. */
  visibility?: PeladaVisibility
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

/**
 * As peladas recomendadas (api#217).
 *
 * As coordenadas são **opcionais**: quando não vão, a API usa o endereço salvo
 * no perfil. O front manda as do navegador quando as tem, porque são mais
 * exatas e mais atuais que um CEP de cadastro.
 */
export function recommendedEvents(params?: {
  latitude?: number
  longitude?: number
  radiusKm?: number
  limit?: number
}): Promise<ApiEnvelope<Recomendacoes>> {
  return api.get('/events/recommended', { params }).then((r) => r.data)
}
