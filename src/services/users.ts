import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, CompetitionLevel, CourtType, SportProfile, UserMe } from '../types/api'

/** ⚠️ Devolve a resposta bruta do axios — quem consome escreve `res.data.data`. */

export interface UpdateProfileInput {
  name?: string
  avatarUrl?: string | null
  pixKey?: string | null
  marketingOptIn?: boolean
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

export const getMe = (): Promise<AxiosResponse<ApiEnvelope<UserMe>>> =>
  api.get('/users/me')

export const updateMe = (
  data: UpdateProfileInput,
): Promise<AxiosResponse<ApiEnvelope<UserMe>>> => api.patch('/users/me', data)

export interface DeleteAccountInput {
  confirmation: 'EXCLUIR MINHA CONTA'
  currentPassword?: string
}

export const deleteMe = (data: DeleteAccountInput): Promise<AxiosResponse<void>> =>
  api.delete('/users/me', { data })

// ── Perfil esportivo por modalidade ──────────────────────────────────────────

export interface UpsertSportProfileInput {
  level: CompetitionLevel
  /**
   * Ausente mantém a posição que já estava; `null` a remove. A API trata os três
   * estados, e o front precisa respeitar a diferença — mandar `""` por engano
   * apagaria a posição de quem só queria trocar de nível.
   */
  position?: string | null
}

export const getSportProfiles = (): Promise<AxiosResponse<ApiEnvelope<SportProfile[]>>> =>
  api.get('/users/me/sports')

export const upsertSportProfile = (
  sport: CourtType,
  data: UpsertSportProfileInput,
): Promise<AxiosResponse<ApiEnvelope<SportProfile>>> => api.put(`/users/me/sports/${sport}`, data)

export const deleteSportProfile = (sport: CourtType): Promise<AxiosResponse<void>> =>
  api.delete(`/users/me/sports/${sport}`)
