import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, Place, PlaceStatus } from '../types/api'

/**
 * ⚠️ Convenção deste arquivo: devolve a RESPOSTA BRUTA do axios, então quem
 * consome escreve `res.data.data`. Difere de auth.ts/events.ts (que devolvem o
 * envelope) e de sports.ts (que devolve o conteúdo já desembrulhado).
 * Comportamento preservado da versão em JS.
 */

export interface PlaceInput {
  name: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country?: string
}

export const list = (): Promise<AxiosResponse<ApiEnvelope<Place[]>>> =>
  api.get('/places')

export const getOne = (id: string): Promise<AxiosResponse<ApiEnvelope<Place>>> =>
  api.get(`/places/${id}`)

export const create = (data: PlaceInput): Promise<AxiosResponse<ApiEnvelope<Place>>> =>
  api.post('/places', data)

export const update = (
  id: string,
  data: Partial<PlaceInput>,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}`, data)

export const updateStatus = (
  id: string,
  status: PlaceStatus,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}/status`, { status })

export const assignOwner = (
  id: string,
  ownerId: string,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}/owner`, { ownerId })
