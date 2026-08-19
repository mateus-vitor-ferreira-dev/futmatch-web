import api from './api'
import type {
  ApiEnvelope,
  CompetitionLevel,
  CourtType,
  Tournament,
  TournamentDivision,
  TournamentFormat,
  TournamentMatch,
  TournamentRegistration,
  RefereeingMatch,
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

/**
 * Inscreve o dono do token na divisão. **Sem corpo** — quem se inscreve é quem
 * está autenticado, e mandar um `userId` daria a impressão de que dá para
 * inscrever outra pessoa.
 *
 * Recusa com 422 quando o campeonato não está `OPEN`, a janela fechou, a
 * divisão lotou ou o campeonato é por equipe; com 409 quando já existe
 * inscrição viva. A tela lê o `code` para dizer qual dos casos foi.
 */
export function registerInDivision(
  tournamentId: string,
  divisionId: string,
): Promise<ApiEnvelope<TournamentRegistration>> {
  return api
    .post(`/tournaments/${tournamentId}/divisions/${divisionId}/registrations`)
    .then((r) => r.data)
}

/** As inscrições do próprio usuário neste campeonato, uma por divisão. */
export function getMyRegistrations(
  tournamentId: string,
): Promise<ApiEnvelope<TournamentRegistration[]>> {
  return api.get(`/tournaments/${tournamentId}/registrations/me`).then((r) => r.data)
}

/**
 * Cancela a inscrição. Só enquanto o campeonato estiver `OPEN`: depois disso a
 * lista de inscritos é o que gera o chaveamento, e sair viraria buraco na chave.
 */
export function cancelRegistration(
  tournamentId: string,
  divisionId: string,
  registrationId: string,
): Promise<ApiEnvelope<TournamentRegistration>> {
  return api
    .delete(`/tournaments/${tournamentId}/divisions/${divisionId}/registrations/${registrationId}`)
    .then((r) => r.data)
}

/**
 * Os inscritos de uma divisão, na visão de quem organiza.
 *
 * **Protegida por `isTournamentManager` na API**, que aceita ADMIN, dono do
 * espaço ou o organizador do campeonato. O front não consegue reproduzir essa
 * regra — `PlaceSummary` não traz `ownerId` —, então quem decide é o 403: ver
 * o `TournamentRegistrations`.
 */
export function getDivisionRegistrations(
  tournamentId: string,
  divisionId: string,
): Promise<ApiEnvelope<TournamentRegistration[]>> {
  return api
    .get(`/tournaments/${tournamentId}/divisions/${divisionId}/registrations`)
    .then((r) => r.data)
}

export function approveRegistration(
  tournamentId: string,
  divisionId: string,
  registrationId: string,
): Promise<ApiEnvelope<TournamentRegistration>> {
  return api
    .patch(`/tournaments/${tournamentId}/divisions/${divisionId}/registrations/${registrationId}/approve`)
    .then((r) => r.data)
}

/**
 * Recusa uma inscrição, com justificativa opcional.
 *
 * **O campo é `adminNote`, e não `reason`.** O `placeRequests.reject` já custou
 * esse aprendizado: o front mandava `reason`, o `stripUnknown` do yup
 * descartava sem reclamar, e o motivo era gravado como `null` — com 200, sem
 * erro e sem ninguém notar. O schema da api nomeia o campo assim de propósito,
 * e tem teste aqui provando o nome no corpo.
 */
export function rejectRegistration(
  tournamentId: string,
  divisionId: string,
  registrationId: string,
  adminNote?: string,
): Promise<ApiEnvelope<TournamentRegistration>> {
  return api
    .patch(
      `/tournaments/${tournamentId}/divisions/${divisionId}/registrations/${registrationId}/reject`,
      // Vazio vira `null`: o schema aceita ausência e `null`, e mandar `""`
      // gravaria uma justificativa em branco que a tela do jogador exibiria.
      { adminNote: adminNote?.trim() ? adminNote.trim() : null },
    )
    .then((r) => r.data)
}

/** As partidas em que o usuário logado foi designado árbitro, de todos os campeonatos. */
export function getRefereeingMatches(): Promise<ApiEnvelope<RefereeingMatch[]>> {
  return api.get('/tournaments/matches/refereeing').then((r) => r.data)
}

/**
 * O resultado da partida: placar dos dois lados **ou** o vencedor do W.O.,
 * nunca os dois juntos.
 *
 * O schema da api recusa o corpo ambíguo, e recusa também o empate — mata-mata
 * precisa de alguém para subir de rodada. O front barra os dois antes de enviar,
 * mas a regra continua sendo da API: barrar aqui é cortesia, não autoridade.
 */
export type MatchResultInput =
  | { scoreA: number; scoreB: number }
  | { walkoverWinnerId: string }

export function submitMatchResult(
  tournamentId: string,
  divisionId: string,
  matchId: string,
  resultado: MatchResultInput,
): Promise<ApiEnvelope<TournamentMatch>> {
  return api
    .patch(`/tournaments/${tournamentId}/divisions/${divisionId}/matches/${matchId}/result`, resultado)
    .then((r) => r.data)
}
