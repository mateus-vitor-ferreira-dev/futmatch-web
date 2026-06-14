import api from './api'

/** Lista todos os torneios com filtros opcionais */
export function listTournaments(filters) {
  return api.get('/tournaments', { params: filters }).then((r) => r.data)
}

/** Busca um torneio pelo ID */
export function getTournament(tournamentId) {
  return api.get(`/tournaments/${tournamentId}`).then((r) => r.data)
}

/** Busca as divisões/chaves de um torneio */
export function getTournamentDivisions(tournamentId) {
  return api.get(`/tournaments/${tournamentId}/divisions`).then((r) => r.data)
}

/**
 * Cria um novo torneio.
 * Requer role OWNER ou ADMIN.
 * @param {{
 *   name, sportType, format, placeId,
 *   startDate, endDate, maxParticipants,
 *   description, registrationFee, rules
 * }} data
 */
export function createTournament(data) {
  return api.post('/tournaments', data).then((r) => r.data)
}

/** Atualiza status de um torneio */
export function updateTournamentStatus(tournamentId, status) {
  return api.patch(`/tournaments/${tournamentId}/status`, { status }).then((r) => r.data)
}

/** Cria uma divisão/categoria dentro de um torneio */
export function createDivision(tournamentId, data) {
  return api.post(`/tournaments/${tournamentId}/divisions`, data).then((r) => r.data)
}