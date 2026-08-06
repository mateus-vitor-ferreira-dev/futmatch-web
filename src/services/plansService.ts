import api from './api'
import type { ApiEnvelope, Plan } from '../types/api'

export const plansService = {
  async getAll(): Promise<Plan[]> {
    const res = await api.get<ApiEnvelope<Plan[]>>('/plans')
    return res.data.data
  },
}
