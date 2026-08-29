import api from './api'
import type { AgendaDaQuadra, ApiEnvelope, Court, CourtStatus, CourtType } from '../types/api'

/** ⚠️ Devolve o ENVELOPE da API — quem consome escreve `res.data`. */

export interface CourtFilters {
  type?: CourtType
  status?: CourtStatus
  minPrice?: number
  maxPrice?: number
  availableAt?: string
  city?: string
  neighborhood?: string
}

export interface CourtInput {
  name: string
  type: CourtType
  pricePerHour?: number | null
}

export function searchCourts(filters?: CourtFilters): Promise<ApiEnvelope<Court[]>> {
  return api.get('/courts', { params: filters }).then((r) => r.data)
}

export function getCourtsByPlace(placeId: string): Promise<ApiEnvelope<Court[]>> {
  return api.get(`/places/${placeId}/courts`).then((r) => r.data)
}

export function createCourt(placeId: string, data: CourtInput): Promise<ApiEnvelope<Court>> {
  return api.post(`/places/${placeId}/courts`, data).then((r) => r.data)
}

export function updateCourt(
  placeId: string,
  courtId: string,
  data: Partial<CourtInput>,
): Promise<ApiEnvelope<Court>> {
  return api.patch(`/places/${placeId}/courts/${courtId}`, data).then((r) => r.data)
}

export function deleteCourt(placeId: string, courtId: string): Promise<ApiEnvelope<Court>> {
  return api.delete(`/places/${placeId}/courts/${courtId}`).then((r) => r.data)
}

export function updateCourtStatus(
  placeId: string,
  courtId: string,
  status: CourtStatus,
): Promise<ApiEnvelope<Court>> {
  return api.patch(`/places/${placeId}/courts/${courtId}/status`, { status }).then((r) => r.data)
}

/**
 * O que já ocupa esta quadra entre `de` e `ate` (api#443).
 *
 * Os dois são opcionais na api — sem eles ela responde as próximas 24 horas —,
 * e obrigatórios aqui: quem chama esta função está olhando um dia específico, e
 * deixar a janela implícita esconderia qual.
 */
export function getAgendaDaQuadra(
  courtId: string,
  de: string,
  ate: string,
): Promise<ApiEnvelope<AgendaDaQuadra>> {
  return api.get(`/courts/${courtId}/agenda`, { params: { de, ate } }).then((r) => r.data)
}
