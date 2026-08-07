import api from './api'
import type { ApiEnvelope, Plan, SubscriptionStatus, SwitchPlanPreview } from '../types/api'

export interface CheckoutSession {
  url: string | null
}

export interface SwitchPlanResult {
  plan: Plan
}

export const subscriptionService = {
  async getStatus(): Promise<SubscriptionStatus> {
    const res = await api.get<ApiEnvelope<SubscriptionStatus>>('/owner/subscription/status')
    return res.data.data
  },

  async createCheckout(planId?: string): Promise<CheckoutSession> {
    const res = await api.post<ApiEnvelope<CheckoutSession>>('/owner/subscription/checkout', { planId })
    return res.data.data
  },

  async switchPlan(planId: string): Promise<SwitchPlanResult> {
    const res = await api.post<ApiEnvelope<SwitchPlanResult>>('/owner/subscription/switch', { planId })
    return res.data.data
  },

  async previewSwitch(planId: string): Promise<SwitchPlanPreview> {
    const res = await api.get<ApiEnvelope<SwitchPlanPreview>>('/owner/subscription/switch/preview', { params: { planId } })
    return res.data.data
  },
}
