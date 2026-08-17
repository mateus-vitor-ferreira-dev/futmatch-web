import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { renderWithProviders, screen, waitFor } from '../../../test/render'
import OwnerInventory from './index'

const subscriptionState = vi.hoisted(() => ({ isActive: true, loading: false }))

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
}))
// `importOriginal` porque o SubscriptionGate, que a tela passou a usar desde a
// #244, importa `diasDeToleranciaRestantes` deste mesmo módulo.
vi.mock('../../../hooks/useSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../hooks/useSubscription')>()),
  useSubscription: () => ({
    sub: null,
    ...subscriptionState,
    podeAlterar: subscriptionState.isActive && !subscriptionState.loading,
  }),
}))
vi.mock('../../../components/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }))
vi.mock('../../../services/places')
vi.mock('../../../services/inventoryService')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import * as placesService from '../../../services/places'
import { inventoryService } from '../../../services/inventoryService'
import { toast } from 'sonner'

const product = {
  id: 'product-1', placeId: 'place-1', nome: 'Gatorade', unidade: 'GARRAFA' as const,
  precoVendaCentavos: 800, estoqueMinimo: 3, ativo: true, saldoAtual: 3,
  estoqueBaixo: true, createdAt: '2026-08-06T12:00:00Z', updatedAt: '2026-08-06T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  subscriptionState.isActive = true
  subscriptionState.loading = false
  vi.mocked(placesService.list).mockResolvedValue({ data: { data: [{ id: 'place-1', ownerId: 'owner-1', name: 'Arena Um' }] } } as never)
  vi.mocked(inventoryService.listProducts).mockResolvedValue([product])
  vi.mocked(inventoryService.listMovements).mockResolvedValue([{
    id: 'movement-1', productId: product.id, tipo: 'ENTRADA', motivo: 'REPOSICAO', quantidade: 5,
    observacao: null, createdAt: '2026-08-06T12:00:00Z', actor: { id: 'owner-1', name: 'Dono', role: 'OWNER' },
    product: { id: product.id, nome: product.nome, unidade: product.unidade },
  }])
})

function apiError(code: string, message: string, status = 409) {
  const error = new AxiosError(message)
  error.response = {
    data: { success: false, code, message },
    status,
    statusText: 'Conflict',
    headers: {},
    config: {} as never,
  }
  return error
}

describe('OwnerInventory', () => {
  it('mostra saldo baixo, estabelecimento e histórico com responsável', async () => {
    renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })

    expect(await screen.findByRole('heading', { name: 'Gatorade' })).toBeInTheDocument()
    expect(screen.getByText('Estoque baixo')).toBeInTheDocument()
    expect(screen.getByText(/reposição por Dono/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Estabelecimento' })).toHaveValue('place-1')
  })

  it('registra venda rápida com a quantidade escolhida e atualiza os dados', async () => {
    vi.mocked(inventoryService.createMovement).mockResolvedValue({} as never)
    const { user } = renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantidade de Gatorade' })
    await user.clear(quantity)
    await user.type(quantity, '2')
    await user.click(screen.getByRole('button', { name: 'Registrar venda' }))

    await waitFor(() => expect(inventoryService.createMovement).toHaveBeenCalledWith(
      'place-1', 'product-1', { tipo: 'SAIDA', motivo: 'VENDA', quantidade: 2 },
    ))
    expect(inventoryService.listProducts).toHaveBeenCalledTimes(2)
  })

  it('envia o filtro de estoque baixo para a API', async () => {
    const { user } = renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })
    await screen.findByRole('heading', { name: 'Gatorade' })

    await user.click(screen.getByRole('checkbox', { name: 'Só estoque baixo' }))

    await waitFor(() => expect(inventoryService.listProducts).toHaveBeenLastCalledWith('place-1', true))
  })

  it('mostra o saldo atual devolvido pela API quando a venda excede o estoque', async () => {
    vi.mocked(inventoryService.createMovement).mockRejectedValue(apiError(
      'PRODUCT_INSUFFICIENT_STOCK',
      'Estoque insuficiente. Saldo atual: 3.',
    ))
    const { user } = renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantidade de Gatorade' })
    await user.clear(quantity)
    await user.type(quantity, '4')
    await user.click(screen.getByRole('button', { name: 'Registrar venda' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Estoque insuficiente. Saldo atual: 3.'))
  })

  it('oferece desativar quando um produto com histórico não pode ser excluído', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(inventoryService.deleteProduct).mockRejectedValue(apiError(
      'PRODUCT_HAS_MOVEMENTS',
      'O produto possui movimentações e não pode ser excluído.',
    ))
    const { user } = renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      'O produto possui movimentações e não pode ser excluído.',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Desativar' }),
      }),
    ))
  })

  it('mantém a consulta disponível e bloqueia alterações sem assinatura ativa', async () => {
    subscriptionState.isActive = false
    renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })

    expect(await screen.findByRole('heading', { name: 'Gatorade' })).toBeInTheDocument()
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar venda' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Novo produto' })).toBeDisabled()
  })
})
