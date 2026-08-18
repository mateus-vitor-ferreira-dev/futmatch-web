/**
 * O `isActive` deste hook decide se o `SubscriptionGate` abre ou bloqueia a
 * tela do dono. Desde a #119 ele precisa **concordar com o middleware da API**:
 * o servidor aceita `past_due` por 7 dias depois do fim do período.
 *
 * Divergir é ruim dos dois lados. Cortar antes do servidor bloqueia quem ainda
 * tem direito, sem explicação. Cortar depois abre a tela para uma ação que vai
 * falhar com 402 — o dono preenche o formulário para levar um não no fim.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../test/render'
import { useSubscription } from './useSubscription'

vi.mock('../services/subscriptionService')
import { subscriptionService } from '../services/subscriptionService'

/**
 * O papel entra no cálculo desde a #265: ADMIN opera a plataforma e não assina,
 * então o hook precisa liberá-lo como a API já libera.
 */
const auth = vi.hoisted(() => ({ estado: { user: null as { role: string } | null } }))
vi.mock('../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const buscaStatus = vi.mocked(subscriptionService.getStatus)

const HORA_MS = 60 * 60 * 1000

/**
 * Data deslocada a partir de agora, em horas.
 *
 * Em horas e não em dias porque os casos que importam são as bordas da janela
 * de tolerância, e uma borda de "exatamente 7 dias" não se testa com relógio
 * real: entre montar a data e o hook compará-la passam alguns milissegundos, e
 * o teste falharia por causa do relógio, não da regra. Com 6h59 e 7h01 de cada
 * lado, a borda é exercitada sem depender do instante exato.
 *
 * O relógio aqui é o de verdade, de propósito. `vi.useFakeTimers` congela os
 * timers de que o `waitFor` da Testing Library depende para fazer polling —
 * mesmo com `shouldAdvanceTime`, todo teste deste arquivo estourava em timeout.
 */
function emHoras(horas: number): string {
  return new Date(Date.now() + horas * HORA_MS).toISOString()
}

const emDias = (dias: number) => emHoras(dias * 24)

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { role: 'OWNER' } }
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

  it('ainda libera uma hora antes de fechar a janela', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: emHoras(-7 * 24 + 1) })

    const result = await montaHook()

    expect(result.current.isActive).toBe(true)
  })

  it('bloqueia uma hora depois de a janela fechar', async () => {
    buscaStatus.mockResolvedValue({ status: 'past_due', currentPeriodEnd: emHoras(-7 * 24 - 1) })

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

describe('useSubscription — funcionalidades do plano', () => {
  it('devolve o que o plano em vigor abre', async () => {
    buscaStatus.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: emDias(20),
      plan: { id: 'pro', nome: 'Só+1 Pro', precoCentavos: 7990, funcionalidades: ['ESTATISTICAS'] },
    })

    const result = await montaHook()

    expect(result.current.funcionalidades).toEqual(['ESTATISTICAS'])
    expect(result.current.temFuncionalidade('ESTATISTICAS')).toBe(true)
    expect(result.current.temFuncionalidade('ESTOQUE')).toBe(false)
  })

  it('plano de entrada não abre nada, e isso não é assinatura quebrada', async () => {
    buscaStatus.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: emDias(20),
      plan: { id: 'basico', nome: 'Só+1 Básico', precoCentavos: 3990, funcionalidades: [] },
    })

    const result = await montaHook()

    // As duas respostas convivem: em dia **e** sem a funcionalidade. É a distinção
    // que manda o dono para a tela de planos em vez da de pagamento.
    expect(result.current.isActive).toBe(true)
    expect(result.current.temFuncionalidade('ESTOQUE')).toBe(false)
  })

  it('sem assinatura não abre nada', async () => {
    buscaStatus.mockResolvedValue({ status: 'inactive', currentPeriodEnd: null })

    const result = await montaHook()

    expect(result.current.funcionalidades).toEqual([])
    expect(result.current.temFuncionalidade('ESTATISTICAS')).toBe(false)
  })

  it('mantém o que o plano EM VIGOR abre, mesmo com downgrade agendado', async () => {
    buscaStatus.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: emDias(20),
      plan: { id: 'premium', nome: 'Só+1 Premium', precoCentavos: 14990, funcionalidades: ['ESTOQUE'] },
      trocaAgendada: {
        plan: { id: 'basico', nome: 'Só+1 Básico', precoCentavos: 3990, funcionalidades: [] },
        valeAPartirDe: emDias(20),
      },
    })

    const result = await montaHook()

    // Quem pagou o Premium até a virada abre o Premium até a virada.
    expect(result.current.temFuncionalidade('ESTOQUE')).toBe(true)
  })
})

describe('useSubscription — ADMIN (#265)', () => {
  beforeEach(() => {
    auth.estado = { user: { role: 'ADMIN' } }
  })

  it('passa mesmo sem assinatura — opera a plataforma, não assina', async () => {
    buscaStatus.mockResolvedValue({ status: 'inactive', currentPeriodEnd: null })

    const result = await montaHook()

    // A API já liberava (subscription.middleware.ts e planFeature.middleware.ts); o
    // front barrava, e o painel do dono aparecia esmaecido para o admin.
    expect(result.current.isActive).toBe(true)
    expect(result.current.temFuncionalidade('ESTOQUE')).toBe(true)
    expect(result.current.temFuncionalidade('ESTATISTICAS')).toBe(true)
  })

  it('passa mesmo assinando um plano que não abre nada', async () => {
    buscaStatus.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: emDias(20),
      plan: { id: 'basico', nome: 'Só+1 Básico', precoCentavos: 3990, funcionalidades: [] },
    })

    const result = await montaHook()

    expect(result.current.temFuncionalidade('EQUIPAMENTOS')).toBe(true)
  })
})
