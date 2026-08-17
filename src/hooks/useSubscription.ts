import { useState, useEffect, useMemo, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { useAuth } from '../contexts/AuthContext'
import type { PlanFeature, SubscriptionStatus } from '../types/api'

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

/**
 * Dias que ainda restam da tolerância de `past_due`, ou `null` quando não é o
 * caso — assinatura em dia, sem assinatura, ou tolerância já vencida.
 *
 * Existe porque `past_due` dentro da janela é um estado que a tela precisa
 * mostrar e não bloquear: a pessoa **consegue** agir, mas o pagamento falhou.
 * Sem aviso, ela só descobre quando a tolerância acaba e a tela fecha do nada.
 */
export function diasDeToleranciaRestantes(sub: SubscriptionStatus | null): number | null {
  if (sub?.status !== 'past_due' || !sub.currentPeriodEnd) return null

  const fimDaTolerancia = new Date(sub.currentPeriodEnd).getTime() + TOLERANCIA_PAST_DUE_DIAS * DIA_MS
  const restante = fimDaTolerancia - Date.now()

  if (restante <= 0) return null

  // Arredonda para cima: faltando algumas horas, "1 dia" é mais honesto com o
  // usuário do que "0 dias" numa tela que ainda está funcionando.
  return Math.ceil(restante / DIA_MS)
}

/**
 * Estado da assinatura e do plano, num lugar só.
 *
 * `isActive` responde "a assinatura está em dia?"; `temFuncionalidade` responde "o
 * plano abre isso?". São perguntas diferentes e as duas telas precisam distinguir:
 * quem está em dia no Básico não resolve nada pagando a fatura — precisa subir de
 * degrau, e mandar a mesma mensagem levaria o dono para a tela errada.
 *
 * **A exceção de ADMIN mora aqui, e só aqui.** A API já a tem em dois middlewares
 * (`subscription.middleware.ts` e `planFeature.middleware.ts`) com a mesma frase:
 * admin opera a plataforma, não assina. O front repetia o cálculo sem a exceção, e
 * por isso barrava um ADMIN que a API liberava — era a #265. Concentrar aqui evita
 * que a próxima tela esqueça de novo.
 */
export function useSubscription(): {
  sub: SubscriptionStatus | null
  isActive: boolean
  loading: boolean
  /** Funcionalidades do plano em vigor. Vazio sem assinatura. */
  funcionalidades: PlanFeature[]
  temFuncionalidade: (funcionalidade: PlanFeature) => boolean
} {
  const { user } = useAuth()
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    subscriptionService.getStatus()
      .then(setSub)
      .catch(() => setSub({ status: 'inactive', currentPeriodEnd: null }))
      .finally(() => setLoading(false))
  }, [])

  const ehAdmin = user?.role === 'ADMIN'

  // O plano EM VIGOR, mesmo havendo downgrade agendado: quem pagou o Premium até
  // a virada continua abrindo o Premium até a virada.
  //
  // Memoizado porque o `?? []` criaria um array novo a cada render, e quem depende
  // disso — o menu do painel, por exemplo — recalcularia sem nada ter mudado.
  const doPlano = sub?.plan?.funcionalidades
  const funcionalidades = useMemo(() => doPlano ?? [], [doPlano])

  const temFuncionalidade = useCallback(
    (funcionalidade: PlanFeature) => ehAdmin || funcionalidades.includes(funcionalidade),
    [ehAdmin, funcionalidades],
  )

  return {
    sub,
    isActive: ehAdmin || estaEmDia(sub),
    loading,
    funcionalidades,
    temFuncionalidade,
  }
}
