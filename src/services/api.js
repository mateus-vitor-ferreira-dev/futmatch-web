import axios from 'axios'
import { env } from '../config/env'

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
    if (err.response?.status === 401) {
      localStorage.removeItem('futmatch:token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
