import api from './api'

/** Busca quadras com filtros opcionais (city, type, etc.) */
export function searchCourts(filters) {
  return api.get('/courts', { params: filters }).then((r) => r.data)
}

/** Busca quadras de um estabelecimento específico */
export function getCourtsByPlace(placeId) {
  return api.get(`/places/${placeId}/courts`).then((r) => r.data)
}

export function createCourt(placeId, data) {
  return api.post(`/places/${placeId}/courts`, data).then((r) => r.data)
}

export function updateCourt(placeId, courtId, data) {
  return api.patch(`/places/${placeId}/courts/${courtId}`, data).then((r) => r.data)
}

export function deleteCourt(placeId, courtId) {
  return api.delete(`/places/${placeId}/courts/${courtId}`).then((r) => r.data)
}

export function updateCourtStatus(placeId, courtId, status) {
  return api.patch(`/places/${placeId}/courts/${courtId}/status`, { status }).then((r) => r.data)
}