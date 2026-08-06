import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../test/render'
import type { Plan, SubscriptionStatus, SwitchPlanPreview } from '../../../types/api'
import OwnerPlans from './index'

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

vi.mock('../../../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../../services/plansService')
vi.mock('../../../services/subscriptionService')
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { plansService } from '../../../services/plansService'
import { subscriptionService } from '../../../services/subscriptionService'

const basico: Plan = {
  id: 'basico', nome: 'Só+1 Básico', precoCentavos: 3990,
  maxQuadras: 3, maxEstabelecimentos: 1, maxModalidades: 2,
}

const pro: Plan = {
  id: 'pro', nome: 'Só+1 Pro', precoCentavos: 7990,
  maxQuadras: 10, maxEstabelecimentos: 3, maxModalidades: 5,
}

const assinaturaPro: SubscriptionStatus = {
  status: 'active',
  currentPeriodEnd: '2026-09-01T00:00:00.000Z',
  stripeSubscriptionId: 'sub_123',
  plan: pro,
  usage: { quadras: 6, estabelecimentos: 2 },
}

const getPlans = vi.mocked(plansService.getAll)
const getStatus = vi.mocked(subscriptionService.getStatus)
const checkout = vi.mocked(subscriptionService.createCheckout)
const previewSwitch = vi.mocked(subscriptionService.previewSwitch)
const switchPlan = vi.mocked(subscriptionService.switchPlan)

beforeEach(() => {
  vi.clearAllMocks()
  getPlans.mockResolvedValue([basico, pro])
  getStatus.mockResolvedValue(assinaturaPro)
})

describe('OwnerPlans', () => {
  it('compara os planos, destaca o atual e mostra uso ao lado do limite', async () => {
    renderWithProviders(<OwnerPlans />)

    expect(await screen.findByText('Seu plano atual')).toBeInTheDocument()
    expect(screen.getByText('6 de 10')).toBeInTheDocument()
    expect(screen.getByText('2 de 3')).toBeInTheDocument()
    expect(screen.getByText('R$ 39,90')).toBeInTheDocument()
    expect(screen.getByText('R$ 79,90')).toBeInTheDocument()
  })

  it('envia ao checkout exatamente o plano escolhido', async () => {
    getStatus.mockResolvedValue({
      status: 'inactive', currentPeriodEnd: null, plan: null,
      usage: { quadras: 1, estabelecimentos: 1 },
    })
    checkout.mockRejectedValue(new Error('checkout indisponível no teste'))

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click((await screen.findAllByRole('button', { name: 'Assinar' }))[0])

    expect(checkout).toHaveBeenCalledWith('basico')
  })

  it('explica o downgrade antes de confirmar e só então efetiva a troca', async () => {
    const preview: SwitchPlanPreview = {
      planoAtual: { id: pro.id, nome: pro.nome, precoCentavos: pro.precoCentavos },
      planoNovo: { id: basico.id, nome: basico.nome, precoCentavos: basico.precoCentavos },
      tipo: 'downgrade',
      estimativaCobrancaCentavos: -2000,
      efetivaImediatamente: true,
      usoExcederiaNovoPlano: { quadras: true, estabelecimentos: true },
    }
    previewSwitch.mockResolvedValue(preview)
    switchPlan.mockResolvedValue({ plan: basico })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    expect(await screen.findByRole('dialog')).toHaveTextContent('Imediatamente')
    expect(screen.getByRole('dialog')).toHaveTextContent('Cobrança imediataNenhuma')
    expect(screen.getByRole('dialog')).toHaveTextContent('Nada do que já existe será removido')
    expect(switchPlan).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar troca' }))
    await waitFor(() => expect(switchPlan).toHaveBeenCalledWith('basico'))
  })
})
