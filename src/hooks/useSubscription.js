import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'

export function useSubscription() {
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    subscriptionService.getStatus()
      .then(setSub)
      .catch(() => setSub({ status: 'inactive' }))
      .finally(() => setLoading(false))
  }, [])

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'

  return { sub, isActive, loading }
}
