import api from './api'
import type { ApiEnvelope, Sport, TournamentFormatInfo } from '../types/api'

/**
 * ⚠️ Este é o único serviço que devolve o conteúdo já DESEMBRULHADO (`data.data`),
 * e não o envelope nem a resposta bruta. Endpoint público, não requer auth.
 */
export const getSports = (): Promise<Sport[]> =>
  api.get<ApiEnvelope<Sport[]>>('/sports').then((r) => r.data.data)

/**
 * Formatos de campeonato, com `implemented` dizendo quais o sistema conduz.
 *
 * Mesmo desembrulho do `getSports` acima, mesma natureza: catálogo público que
 * o front não deve manter por conta própria — foi assim que o seletor passou a
 * oferecer cinco formatos enquanto a API conduzia um. Ver api#263.
 */
export const getTournamentFormats = (): Promise<TournamentFormatInfo[]> =>
  api.get<ApiEnvelope<TournamentFormatInfo[]>>('/tournament-formats').then((r) => r.data.data)
