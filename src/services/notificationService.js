import api from './api'

export const notificationService = {
  list: () => api.get('/notifications').then(r => r.data.data?.notifications ?? []),
  readAll: () => api.patch('/notifications/read-all'),
  readOne: (id) => api.patch(`/notifications/${id}/read`),
}
