import api from './api'

export function searchEvents(filters) {
  return api.get('/events', { params: filters }).then((r) => r.data)
}