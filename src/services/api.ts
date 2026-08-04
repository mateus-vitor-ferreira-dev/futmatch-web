import axios, { AxiosError } from 'axios'
import { env } from '../config/env'

/** Chave do token no localStorage — usada aqui e no AuthContext. */
export const TOKEN_KEY = 'só+1:token'

/**
 * Instância Axios compartilhada por todos os serviços.
 *
 * Interceptors configurados:
 *  - Request: injeta o Bearer token do localStorage em todas as requisições.
 *  - Response: em caso de 401, limpa o token e redireciona para /login.
 */
const api = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    // Token expirado ou inválido — desloga automaticamente
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
