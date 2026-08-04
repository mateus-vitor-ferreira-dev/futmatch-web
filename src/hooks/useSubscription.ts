import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import type { SubscriptionStatus } from '../types/api'

export function useSubscription(): {
  sub: SubscriptionStatus | null
  isActive: boolean
  loading: boolean
} {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    subscriptionService.getStatus()
      .then(setSub)
      .catch(() => setSub({ status: 'inactive', currentPeriodEnd: null }))
      .finally(() => setLoading(false))
  }, [])

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'

  return { sub, isActive, loading }
}
