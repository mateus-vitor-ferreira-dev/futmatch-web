import api from './api'

export const subscriptionService = {
  async getStatus() {
    const res = await api.get('/owner/subscription/status')
    return res.data
  },

  async createCheckout() {
    const res = await api.post('/owner/subscription/checkout')
    return res.data
  },
}
