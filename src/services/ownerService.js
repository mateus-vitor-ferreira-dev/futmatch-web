import api from './api'

export const ownerService = {
  getStats: () => api.get('/owner/stats').then(r => r.data.data),
}
