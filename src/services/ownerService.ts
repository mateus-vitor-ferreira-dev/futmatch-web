import api from './api'
import type { ApiEnvelope, OwnerStats } from '../types/api'

export const ownerService = {
  getStats: (): Promise<OwnerStats> =>
    api.get<ApiEnvelope<OwnerStats>>('/owner/stats').then((r) => r.data.data),
}
