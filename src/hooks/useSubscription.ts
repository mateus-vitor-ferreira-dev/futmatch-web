import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import type { SubscriptionStatus } from '../types/api'

const DIA_MS = 24 * 60 * 60 * 1000

/** Status do Stripe em que a assinatura está paga e em dia. */
const STATUS_ATIVOS = ['active', 'trialing']

/**
 * Tolerância para `past_due`, espelhando o middleware da API.
 *
 * Os dois números precisam bater. Se o front cortar antes, o dono vê a tela
 * bloqueada enquanto o servidor ainda o aceitaria — e ele não tem como saber
 * que continua no direito. Se cortar depois, a tela abre e a ação falha com
 * 402, que é pior: o usuário preenche o formulário para levar um não no fim.
 *
 * Fonte: `so-mais-um-api/src/middlewares/subscription.middleware.ts`.
 */
const TOLERANCIA_PAST_DUE_DIAS = 7

function estaEmDia(sub: SubscriptionStatus | null): boolean {
  if (!sub) return false
  if (STATUS_ATIVOS.includes(sub.status)) return true
  if (sub.status !== 'past_due') return false

  // Sem data de fim não há de onde medir — mesmo lado seguro da API.
  if (!sub.currentPeriodEnd) return false

  return Date.now() <= new Date(sub.currentPeriodEnd).getTime() + TOLERANCIA_PAST_DUE_DIAS * DIA_MS
}

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

  return { sub, isActive: estaEmDia(sub), loading }
}
