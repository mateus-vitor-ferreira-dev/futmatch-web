import api from './api'

/** Busca peladas com filtros (status, sport, city, etc.) */
export function searchEvents(filters) {
  return api.get('/events', { params: filters }).then((r) => r.data)
}

/** Busca peladas criadas pelo usuário logado */
export function myCreatedEvents(filters) {
  return api.get('/events/my/created', { params: filters }).then((r) => r.data)
}

/** Busca peladas que o usuário está participando */
export function myParticipations(filters) {
  return api.get('/events/my/participating', { params: filters }).then((r) => r.data)
}

/**
 * Cria uma nova pelada vinculada a uma quadra.
 * @param {string} courtId - ID da quadra
 * @param {{ date, maxPlayers, totalValue, pixKey }} data
 */
export function createEvent(courtId, data) {
  return api.post(`/courts/${courtId}/events`, data).then((r) => r.data)
}

/** Busca os detalhes de uma pelada */
export function getEvent(courtId, eventId) {
  return api.get(`/courts/${courtId}/events/${eventId}`).then((r) => r.data)
}