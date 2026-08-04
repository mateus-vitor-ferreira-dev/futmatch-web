import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, UserRole } from '../types/api'

/** ⚠️ Devolve a resposta bruta do axios — quem consome escreve `res.data.data`. */

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  badge: string | null
  createdAt: string
  _count: { placesOwned: number; peladasCreated: number; participations: number }
}

export interface InviteResult {
  email: string
  expiresAt: string
  inviteUrl: string
}

export const listUsers = (role?: UserRole): Promise<AxiosResponse<ApiEnvelope<AdminUser[]>>> =>
  api.get('/admin/users', { params: role ? { role } : undefined })

export const updateUserRole = (
  userId: string,
  role: UserRole,
): Promise<AxiosResponse<ApiEnvelope<AdminUser>>> =>
  api.patch(`/admin/users/${userId}/role`, { role })

export const inviteOwner = (email: string): Promise<AxiosResponse<ApiEnvelope<InviteResult>>> =>
  api.post('/admin/invite-owner', { email })
