import api from './api'
import type { ApiEnvelope, Sport } from '../types/api'

/**
 * ⚠️ Este é o único serviço que devolve o conteúdo já DESEMBRULHADO (`data.data`),
 * e não o envelope nem a resposta bruta. Endpoint público, não requer auth.
 */
export const getSports = (): Promise<Sport[]> =>
  api.get<ApiEnvelope<Sport[]>>('/sports').then((r) => r.data.data)
