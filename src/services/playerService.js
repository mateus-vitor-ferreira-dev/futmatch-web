import api from './api'

export const playerService = {
  // --- QUERO JOGAR ---
  searchEvents: async params => {
    const { data } = await api.get('/events', { params })
    return data
  },

  joinEvent: async (courtId, eventId) => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/participations`
    )
    return data
  },

  // --- MEUS JOGOS ---
  getMyCreatedEvents: async params => {
    const { data } = await api.get('/events/my/created', { params })
    return data
  },

  getMyParticipatingEvents: async params => {
    const { data } = await api.get('/events/my/participating', { params })
    return data
  },

  createEvent: async (courtId, payload) => {
    const { data } = await api.post(`/courts/${courtId}/events`, payload)
    return data
  },

  // Busca quadras para o modal de criar jogo
  getCourts: async params => {
    const { data } = await api.get('/courts', { params })
    return data
  },

  // --- HISTÓRICO E AVALIAÇÕES ---
  getUserReviews: async userId => {
    const { data } = await api.get(`/users/${userId}/reviews`)
    return data
  },

  getUserReviewsGiven: async userId => {
    const { data } = await api.get(`/users/${userId}/reviews/given`)
    return data
  },

  getEventParticipants: async (courtId, eventId) => {
    const { data } = await api.get(
      `/courts/${courtId}/events/${eventId}/participations`
    )
    return data
  },

  submitReview: async (courtId, eventId, payload) => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/reviews`,
      payload
    )
    return data
  },

  getReviewProgress: async (courtId, eventId) => {
    const { data } = await api.get(
      `/courts/${courtId}/events/${eventId}/reviews/progress`
    )
    return data
  },

  // --- SORTEIO ---
  drawTeams: async (courtId, eventId, teamCount) => {
    const { data } = await api.post(
      `/courts/${courtId}/events/${eventId}/draw`,
      { teamCount }
    )
    return data
  },

  // --- DETALHE DE EVENTO ---
  getEvent: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}`)
    return data
  },

  // --- STATUS DO EVENTO (organizador) ---
  updateEventStatus: async (courtId, eventId, status) => {
    const { data } = await api.patch(
      `/courts/${courtId}/events/${eventId}/status`,
      { status }
    )
    return data
  },
}
