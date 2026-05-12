import axios from 'axios'
import { env } from '../config/env'

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
  const token = localStorage.getItem('futmatch:token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Token expirado ou inválido — desloga automaticamente
    if (err.response?.status === 401) {
      localStorage.removeItem('futmatch:token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
