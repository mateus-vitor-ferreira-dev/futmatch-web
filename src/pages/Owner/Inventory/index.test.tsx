import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../test/render'
import OwnerInventory from './index'

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
}))
vi.mock('../../../hooks/useSubscription', () => ({ useSubscription: () => ({ sub: null, isActive: true, loading: false }) }))
vi.mock('../../../components/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }))
vi.mock('../../../components/SubscriptionGate', () => ({ default: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('../../../services/places')
vi.mock('../../../services/inventoryService')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import * as placesService from '../../../services/places'
import { inventoryService } from '../../../services/inventoryService'

const product = {
  id: 'product-1', placeId: 'place-1', nome: 'Gatorade', unidade: 'GARRAFA' as const,
  precoVendaCentavos: 800, estoqueMinimo: 3, ativo: true, saldoAtual: 3,
  estoqueBaixo: true, createdAt: '2026-08-06T12:00:00Z', updatedAt: '2026-08-06T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(placesService.list).mockResolvedValue({ data: { data: [{ id: 'place-1', ownerId: 'owner-1', name: 'Arena Um' }] } } as never)
  vi.mocked(inventoryService.listProducts).mockResolvedValue([product])
  vi.mocked(inventoryService.listMovements).mockResolvedValue([{
    id: 'movement-1', productId: product.id, tipo: 'ENTRADA', motivo: 'REPOSICAO', quantidade: 5,
    observacao: null, createdAt: '2026-08-06T12:00:00Z', actor: { id: 'owner-1', name: 'Dono', role: 'OWNER' },
    product: { id: product.id, nome: product.nome, unidade: product.unidade },
  }])
})

describe('OwnerInventory', () => {
  it('mostra saldo baixo, estabelecimento e histórico com responsável', async () => {
    renderWithProviders(<OwnerInventory />, { route: '/owner/inventory?placeId=place-1' })

    expect(await screen.findByText('Gatorade')).toBeInTheDocument()
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
})
