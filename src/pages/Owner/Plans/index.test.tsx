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
  currentPeriodEnd: '2026-09-01T12:00:00.000Z',
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

  /**
   * Downgrade vale no fim do ciclo, não na hora. A tela precisa dizer isso, e
   * não pode prometer crédito: a API devolve `estimativaCobrancaCentavos: 0`
   * justamente porque nada é cobrado nem creditado agora.
   */
  const previewDowngrade: SwitchPlanPreview = {
    planoAtual: { id: pro.id, nome: pro.nome, precoCentavos: pro.precoCentavos },
    planoNovo: { id: basico.id, nome: basico.nome, precoCentavos: basico.precoCentavos },
    tipo: 'downgrade',
    estimativaCobrancaCentavos: 0,
    efetivaImediatamente: false,
    valeAPartirDe: '2026-09-01T12:00:00.000Z',
    usoExcederiaNovoPlano: { quadras: true, estabelecimentos: true },
  }

  it('explica o downgrade antes de confirmar e só então efetiva a troca', async () => {
    previewSwitch.mockResolvedValue(previewDowngrade)
    switchPlan.mockResolvedValue({
      plan: pro, planoAgendado: basico, efetivaImediatamente: false,
      valeAPartirDe: '2026-09-01T12:00:00.000Z',
    })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('Em 01/09/2026')
    expect(dialogo).toHaveTextContent('Nada do que já existe será removido')
    expect(switchPlan).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar troca' }))
    await waitFor(() => expect(switchPlan).toHaveBeenCalledWith('basico'))
  })

  it('não promete crédito num downgrade — nada é cobrado nem creditado agora', async () => {
    previewSwitch.mockResolvedValue(previewDowngrade)

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    const dialogo = await screen.findByRole('dialog')
    // A tela anunciava "Crédito estimado na próxima fatura" com um valor.
    expect(dialogo).not.toHaveTextContent(/cr[ée]dito estimado/i)
    expect(dialogo).toHaveTextContent('Cobrança ou crédito agoraNenhum')
    expect(dialogo).not.toHaveTextContent('Imediatamente')
  })

  it('upgrade segue anunciando efeito imediato e o ajuste da fatura', async () => {
    previewSwitch.mockResolvedValue({
      planoAtual: { id: basico.id, nome: basico.nome, precoCentavos: basico.precoCentavos },
      planoNovo: { id: pro.id, nome: pro.nome, precoCentavos: pro.precoCentavos },
      tipo: 'upgrade',
      estimativaCobrancaCentavos: 2000,
      efetivaImediatamente: true,
      valeAPartirDe: null,
      usoExcederiaNovoPlano: null,
    })
    getStatus.mockResolvedValue({ ...assinaturaPro, plan: basico })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click((await screen.findAllByRole('button', { name: 'Trocar para este plano' }))[0])

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('Imediatamente')
    expect(dialogo).toHaveTextContent('Ajuste estimado na próxima fatura')
  })

  /**
   * Sem este aviso, quem agenda um downgrade volta para uma tela idêntica à de
   * antes — plano antigo em vigor, nenhum sinal do agendamento — e conclui que
   * a troca não pegou.
   */
  it('avisa que há troca agendada, sem trocar o plano em vigor', async () => {
    getStatus.mockResolvedValue({
      ...assinaturaPro,
      trocaAgendada: { plan: basico, valeAPartirDe: '2026-09-01T12:00:00.000Z' },
    })

    renderWithProviders(<OwnerPlans />)

    expect(await screen.findByText(/Troca agendada para 01\/09\/2026/)).toBeInTheDocument()
    // O plano em vigor continua sendo o Pro, e é ele que rege os limites.
    expect(screen.getByText('Seu plano atual').closest('div')).toHaveTextContent('Só+1 Pro')
  })

  it('cancela a troca agendada voltando para o plano em vigor', async () => {
    getStatus.mockResolvedValue({
      ...assinaturaPro,
      trocaAgendada: { plan: basico, valeAPartirDe: '2026-09-01T12:00:00.000Z' },
    })
    switchPlan.mockResolvedValue({
      plan: pro, efetivaImediatamente: true, valeAPartirDe: null,
    })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar troca' }))

    // Não há rota própria para cancelar: trocar para o plano em vigor solta o
    // agendamento, e é o que a API espera.
    await waitFor(() => expect(switchPlan).toHaveBeenCalledWith('pro'))
  })

  it('não mostra aviso de agendamento quando não há nenhum', async () => {
    renderWithProviders(<OwnerPlans />)

    await screen.findByText('Seu plano atual')
    expect(screen.queryByText(/Troca agendada/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar troca' })).not.toBeInTheDocument()
  })
})
