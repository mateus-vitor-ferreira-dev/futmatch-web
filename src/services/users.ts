import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, UserMe } from '../types/api'

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
