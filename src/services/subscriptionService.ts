import api from './api'
import type { ApiEnvelope, SubscriptionStatus } from '../types/api'

export interface CheckoutSession {
  url: string | null
}

export const subscriptionService = {
  async getStatus(): Promise<SubscriptionStatus> {
    const res = await api.get<ApiEnvelope<SubscriptionStatus>>('/owner/subscription/status')
    return res.data.data
  },

  async createCheckout(): Promise<CheckoutSession> {
    const res = await api.post<ApiEnvelope<CheckoutSession>>('/owner/subscription/checkout')
    return res.data.data
  },
}
