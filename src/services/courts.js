import api from './api'

/** Busca quadras com filtros opcionais (city, type, etc.) */
export function searchCourts(filters) {
  return api.get('/courts', { params: filters }).then((r) => r.data)
}

/** Busca quadras de um estabelecimento específico */
export function getCourtsByPlace(placeId) {
  return api.get(`/places/${placeId}/courts`).then((r) => r.data)
}