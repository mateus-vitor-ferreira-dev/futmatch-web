import api from './api'
import type { ApiEnvelope, AuthResult, UserMe } from '../types/api'

/**
 * ⚠️ Convenção deste arquivo: as funções devolvem o ENVELOPE da API
 * (`{ success, data }`), não o `data` interno — por isso quem consome escreve
 * `res.data.token`. Comportamento preservado da versão em JS.
 *
 * A camada de serviços não é uniforme nisto: places.ts e users.ts devolvem a
 * resposta bruta do axios, e sports.ts devolve o `data` já desembrulhado. As
 * três convenções convivem e cada consumidor precisa saber qual usar. Os tipos
 * agora tornam isso visível, mas unificar mudaria todos os pontos de chamada.
 */

export interface RegisterInput {
  name: string
  email: string
  password: string
  confirmPassword: string
  marketingOptIn: boolean
  sports?: string[]
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterOwnerInput {
  name: string
  password: string
  confirmPassword: string
  inviteToken: string
}

export interface InviteInfo {
  email: string
  expiresAt: string
}

export interface MensagemResult {
  message: string
}

/** Cria uma nova conta com e-mail e senha. */
export const register = (data: RegisterInput): Promise<ApiEnvelope<AuthResult>> =>
  api.post('/auth/register', data).then((r) => r.data)

/** Autentica com e-mail e senha. */
export const login = (data: LoginInput): Promise<ApiEnvelope<AuthResult>> =>
  api.post('/auth/login', data).then((r) => r.data)

/** Autentica via Google OAuth. `idToken` vem do GoogleLogin do @react-oauth/google. */
export const googleAuth = (idToken: string): Promise<ApiEnvelope<AuthResult>> =>
  api.post('/auth/google', { idToken }).then((r) => r.data)

/** Dados do usuário autenticado (requer token no header). */
export const getMe = (): Promise<ApiEnvelope<UserMe>> =>
  api.get('/auth/me').then((r) => r.data)

export const forgotPassword = (email: string): Promise<ApiEnvelope<MensagemResult>> =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ApiEnvelope<MensagemResult>> =>
  api.post('/auth/reset-password', { token, newPassword, confirmPassword }).then((r) => r.data)

export const verifyInvite = (token: string): Promise<ApiEnvelope<InviteInfo>> =>
  api.get('/auth/verify-invite', { params: { token } }).then((r) => r.data)

export const registerOwner = (data: RegisterOwnerInput): Promise<ApiEnvelope<AuthResult>> =>
  api.post('/auth/register-owner', data).then((r) => r.data)
