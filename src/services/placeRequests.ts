import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, PlaceRequest, PlaceRequestStatus } from '../types/api'

/** ⚠️ Devolve a resposta bruta do axios — quem consome escreve `res.data.data`. */

export interface PlaceRequestInput {
  name: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country?: string
  latitude?: number | null
  longitude?: number | null
}

type Resposta<T> = Promise<AxiosResponse<ApiEnvelope<T>>>

export const listAll = (status?: PlaceRequestStatus): Resposta<PlaceRequest[]> =>
  api.get('/place-requests', { params: status ? { status } : undefined })

export const listMine = (status?: PlaceRequestStatus): Resposta<PlaceRequest[]> =>
  api.get('/place-requests/my', { params: status ? { status } : undefined })

export const create = (data: PlaceRequestInput): Resposta<PlaceRequest> =>
  api.post('/place-requests', data)

export const approve = (id: string): Resposta<PlaceRequest> =>
  api.patch(`/place-requests/${id}/approve`)

/**
 * O corpo precisa usar `adminNote`, que é o nome do campo no
 * rejectPlaceRequestSchema da API (e da coluna no banco).
 *
 * Antes era enviado `reason`: o validate middleware roda com stripUnknown, então
 * o campo era removido do corpo, `req.body.adminNote` chegava undefined e a
 * justificativa era gravada como null. O admin escrevia o motivo da recusa e ele
 * simplesmente não era salvo — sem erro nenhum, request retornava 200.
 */
export const reject = (id: string, adminNote?: string): Resposta<PlaceRequest> =>
  api.patch(`/place-requests/${id}/reject`, { adminNote })
