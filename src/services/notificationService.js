import api from './api'

export const notificationService = {
  list: () => api.get('/notifications').then(r => r.data.data ?? []),
  readAll: () => api.patch('/notifications/read-all'),
  readOne: (id) => api.patch(`/notifications/${id}/read`),
}
