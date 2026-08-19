import api from './api'
import type {
  ApiEnvelope,
  CompetitionLevel,
  CourtType,
  Tournament,
  TournamentDivision,
  TournamentFormat,
  TournamentMatch,
  TournamentStatus,
} from '../types/api'

/** ⚠️ Devolve o ENVELOPE da API — quem consome escreve `res.data`. */

export interface TournamentFilters {
  placeId?: string
  sportType?: CourtType
  status?: TournamentStatus
  format?: TournamentFormat
}

export interface CreateTournamentInput {
  name: string
  sportType: CourtType
  format: TournamentFormat
  placeId: string
  startDate?: string | null
  endDate?: string | null
  maxParticipants?: number | null
  description?: string | null
  registrationFee?: number | null
  rules?: string | null
}

export interface CreateDivisionInput {
  name: string
  description?: string | null
  genderRestriction?: string | null
  ageRestriction?: string | null
  level?: CompetitionLevel
  minPlayersPerTeam?: number
  maxPlayersPerTeam?: number
  maxParticipants?: number | null
}

export function listTournaments(filters?: TournamentFilters): Promise<ApiEnvelope<Tournament[]>> {
  return api.get('/tournaments', { params: filters }).then((r) => r.data)
}

export function getTournament(tournamentId: string): Promise<ApiEnvelope<Tournament>> {
  return api.get(`/tournaments/${tournamentId}`).then((r) => r.data)
}

export function getTournamentDivisions(
  tournamentId: string,
): Promise<ApiEnvelope<TournamentDivision[]>> {
  return api.get(`/tournaments/${tournamentId}/divisions`).then((r) => r.data)
}

/**
 * O chaveamento de uma divisão, ordenado por rodada e posição.
 *
 * **Leitura pública, como o resto do campeonato** — chave é o que se manda para
 * o grupo do WhatsApp, e exigir login fecharia a tela que traz gente.
 *
 * Divisão sem chaveamento devolve lista vazia, e não 404: a divisão existe, o
 * que não existe é a chave dela. São telas diferentes, e o front distingue as
 * duas por isto.
 */
export function getDivisionMatches(
  tournamentId: string,
  divisionId: string,
): Promise<ApiEnvelope<TournamentMatch[]>> {
  return api
    .get(`/tournaments/${tournamentId}/divisions/${divisionId}/matches`)
    .then((r) => r.data)
}

/** Requer role OWNER ou ADMIN. */
export function createTournament(
  data: CreateTournamentInput,
): Promise<ApiEnvelope<Tournament>> {
  return api.post('/tournaments', data).then((r) => r.data)
}

export function updateTournamentStatus(
  tournamentId: string,
  status: TournamentStatus,
): Promise<ApiEnvelope<Tournament>> {
  return api.patch(`/tournaments/${tournamentId}/status`, { status }).then((r) => r.data)
}

export function createDivision(
  tournamentId: string,
  data: CreateDivisionInput,
): Promise<ApiEnvelope<TournamentDivision>> {
  return api.post(`/tournaments/${tournamentId}/divisions`, data).then((r) => r.data)
}
