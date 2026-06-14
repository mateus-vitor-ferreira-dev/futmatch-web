import api from './api'

/**
 * Cria uma nova conta com e-mail e senha.
 * @param {{ name: string, email: string, password: string, confirmPassword: string, sports?: string[] }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data)

/**
 * Autentica com e-mail e senha.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
export const login = (data) =>
  api.post('/auth/login', data).then((r) => r.data)

/**
 * Autentica via Google OAuth.
 * @param {string} idToken — Token retornado pelo GoogleLogin do @react-oauth/google
 * @returns {Promise<{ user: object, token: string }>}
 */
export const googleAuth = (idToken) =>
  api.post('/auth/google', { idToken }).then((r) => r.data)

/**
 * Retorna os dados do usuário autenticado (requer token no header).
 * @returns {Promise<object>} Dados do usuário
 */
export const getMe = () =>
  api.get('/auth/me').then((r) => r.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token, newPassword, confirmPassword) =>
  api.post('/auth/reset-password', { token, newPassword, confirmPassword }).then((r) => r.data)

export const verifyInvite = (token) =>
  api.get('/auth/verify-invite', { params: { token } }).then((r) => r.data)

export const registerOwner = (data) =>
  api.post('/auth/register-owner', data).then((r) => r.data)
