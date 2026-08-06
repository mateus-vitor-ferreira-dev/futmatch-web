/**
 * O `isActive` deste hook decide se o `SubscriptionGate` abre ou bloqueia a
 * tela do dono. Desde a #119 ele precisa **concordar com o middleware da API**:
 * o servidor aceita `past_due` por 7 dias depois do fim do período.
 *
 * Divergir é ruim dos dois lados. Cortar antes do servidor bloqueia quem ainda
 * tem direito, sem explicação. Cortar depois abre a tela para uma ação que vai
 * falhar com 402 — o dono preenche o formulário para levar um não no fim.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '../test/render'
import { useSubscription } from './useSubscription'

vi.mock('../services/subscriptionService')
import { subscriptionService } from '../services/subscriptionService'

const buscaStatus = vi.mocked(subscriptionService.getStatus)

const AGORA = new Date('2026-08-06T12:00:00.000Z')

/** Data deslocada em dias a partir de um "agora" fixo. */
function emDias(dias: number): string {
  return new Date(AGORA.getTime() + dias * 24 * 60 * 60 * 1000).toISOString()
}

beforeEach(() => {
  vi.clearAllMocks()
  // `shouldAdvanceTime` é o que torna o relógio fixo compatível com o
  // `waitFor`: sem ele os timers ficam congelados, o polling da Testing
  // Library nunca roda e todo teste deste arquivo estoura em timeout.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(AGORA)
})

afterEach(() => {
  vi.useRealTimers()
})

/** Monta o hook e espera o carregamento terminar. */
async function montaHook() {
  const { result } = renderHook(() => useSubscription())
  await waitFor(() => expect(result.current.loading).toBe(false))
  return result
}

describe('useSubscription — status que liberam', () => {
  it.each(['active', 'trialing'])('libera com status %s', async (status) => {
    buscaStatus.mockResolvedValue({ status, currentPeriodEnd: emDias(20) })

    const result = await montaHook()

    expect(result.current.isActive).toBe(true)
  })
})

describe('useSubscription — status que bloqueiam', () => {
  it.each(['inactive', 'canceled', 'unpaid', 'incomplete'])(
    'bloqueia com status %s',
    async (status) => {
      buscaStatus.mockResolvedValue({ status, currentPeriodEnd: emDias(20) })

      const result = await montaHook()

      expect(result.current.isActive).toBe(false)
    },
  )

  it('bloqueia quando a consulta falha', async () => {
    buscaStatus.mockRejectedValue(new Error('fora do ar'))

    const result = await montaHook()

    // Falhar aberto entregaria o produto a quem não paga sempre que a API
    // oscilasse. O lado seguro é bloquear.
    expect(result.current.isActive).toBe(false)
  })
})

describe('useSubscription — tolerância de past_due', () => {
  it('libera no dia seguinte ao vencimento', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: emDias(-1) })

    const result = await montaHook()

    // Cartão recusado e recobrado no dia seguinte não pode derrubar ninguém.
    expect(result.current.isActive).toBe(true)
  })

  it('ainda libera no sétimo dia', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: emDias(-7) })

    const result = await montaHook()

    expect(result.current.isActive).toBe(true)
  })

  it('bloqueia depois da janela de 7 dias', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: emDias(-8) })

    const result = await montaHook()

    expect(result.current.isActive).toBe(false)
  })

  it('bloqueia past_due sem data de fim', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: null })

    const result = await montaHook()

    // Sem data não há de onde medir a tolerância — mesmo lado seguro da API,
    // senão um past_due sem data viraria liberação eterna.
    expect(result.current.isActive).toBe(false)
  })
})
