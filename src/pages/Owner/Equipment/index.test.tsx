import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { renderWithProviders } from '../../../test/render'
import OwnerEquipment from './index'
import type { Equipment, EquipmentLoan, Place } from '../../../types/api'

const assinatura = vi.hoisted(() => ({ isActive: true, loading: false }))

vi.mock('../../../services/places')
vi.mock('../../../services/equipmentService')
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
// O SubscriptionGate deixou de ser mockado na #244: agora ele só avisa, e é
// dele que sai a faixa que o caso de assinatura inativa procura.
// `importOriginal` porque o componente importa `diasDeToleranciaRestantes`
// deste mesmo módulo.
vi.mock('../../../hooks/useSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../hooks/useSubscription')>()),
  useSubscription: () => ({
    sub: { status: 'active' },
    ...assinatura,
    podeAlterar: assinatura.isActive && !assinatura.loading,
  }),
}))
vi.mock('../../../components/DashboardLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import * as placesService from '../../../services/places'
import * as equipmentService from '../../../services/equipmentService'

const place = {
  id: 'place-1', ownerId: 'owner-1', name: 'Arena Central', city: 'Lavras', state: 'MG',
} as Place

const equipment = {
  id: 'equipment-1', placeId: place.id, nome: 'Bolas de beach tennis', modalidade: 'BEACH_TENNIS',
  quantidadeTotal: 10, quantidadeFora: 2, quantidadeDisponivel: 8, estado: 'BOM',
  createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
} satisfies Equipment

const loan = {
  id: 'loan-1', equipmentId: equipment.id, borrowerId: 'player-1', peladaId: null,
  quantidadeEmprestada: 6, quantidadeDevolvida: 4, quantidadeBaixada: 0, quantidadePendente: 2,
  emprestadoEm: '2026-08-05T10:00:00.000Z', encerradoEm: null, observacao: null,
  equipment, borrower: { id: 'player-1', name: 'Ana Jogadora', nickname: 'Aninha', avatarUrl: null },
  createdBy: { id: 'owner-1', name: 'Dono', nickname: null, avatarUrl: null },
  pelada: null, settlements: [],
} satisfies EquipmentLoan

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.isActive = true
  assinatura.loading = false
  vi.mocked(placesService.list).mockResolvedValue({ data: { success: true, data: [place] } } as Awaited<ReturnType<typeof placesService.list>>)
  vi.mocked(equipmentService.listItems).mockResolvedValue([equipment])
  vi.mocked(equipmentService.listLoans).mockResolvedValue([loan])
  vi.mocked(equipmentService.listPeladas).mockResolvedValue([])
  vi.mocked(equipmentService.searchBorrowers).mockResolvedValue([loan.borrower])
  vi.mocked(equipmentService.settleLoan).mockResolvedValue({ quantidadePendente: 1 })
})

describe('OwnerEquipment', () => {
  it('mostra disponível versus total e a pendência com quem levou', async () => {
    renderWithProviders(<OwnerEquipment />, { route: '/owner/equipment?placeId=place-1' })

    expect(await screen.findByText(/disponíveis de/)).toHaveTextContent('8 disponíveis de 10')
    expect(screen.getByText(/Saíram/)).toHaveTextContent('Saíram 6 · faltam 2')
    expect(screen.getByText('Aninha')).toBeInTheDocument()
  })

  it('lança devolução parcial sem encerrar tudo à força', async () => {
    const { user } = renderWithProviders(<OwnerEquipment />, { route: '/owner/equipment?placeId=place-1' })
    await user.click(await screen.findByRole('button', { name: /devolver \/ baixar/i }))

    const quantity = screen.getByRole('spinbutton', { name: /Quantidade/ })
    await user.clear(quantity)
    await user.type(quantity, '1')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(equipmentService.settleLoan).toHaveBeenCalledWith('place-1', 'loan-1', {
      tipo: 'DEVOLUCAO', quantidade: 1, observacao: null,
    }))
  })

  it('explica que perda ou quebra reduz o total antes da confirmação', async () => {
    const { user } = renderWithProviders(<OwnerEquipment />, { route: '/owner/equipment?placeId=place-1' })
    await user.click(await screen.findByRole('button', { name: /devolver \/ baixar/i }))

    expect(screen.getByText(/Perda ou quebra reduz a quantidade total/)).toBeInTheDocument()
    expect(screen.getByText(/Pode devolver só uma parte agora/)).toBeInTheDocument()
  })
})

/**
 * A #244: esta tela escondia tudo com a assinatura vencida, enquanto o Estoque,
 * na mesma navegação lateral, deixava consultar e só travava a edição. Quem
 * segue o contrato do servidor é o Estoque.
 */
describe('OwnerEquipment — assinatura inativa', () => {
  it('mantém o equipamento à vista e desabilita as ações que gravam', async () => {
    assinatura.isActive = false

    renderWithProviders(<OwnerEquipment />, { route: '/owner/equipment?placeId=place-1' })

    // Dois cartões trazem o nome: o do empréstimo em aberto e o do equipamento.
    expect(await screen.findAllByText('Bolas de beach tennis')).not.toHaveLength(0)
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /novo equipamento/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /registrar saída/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /devolver \/ baixar/i })).toBeDisabled()

    // Atualizar é leitura — continua valendo.
    expect(screen.getByRole('button', { name: /atualizar/i })).toBeEnabled()
  })

  it('com assinatura em dia, nada é avisado nem desabilitado', async () => {
    renderWithProviders(<OwnerEquipment />, { route: '/owner/equipment?placeId=place-1' })

    expect(await screen.findAllByText('Bolas de beach tennis')).not.toHaveLength(0)
    expect(screen.queryByText(/pode consultar, mas precisa/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /novo equipamento/i })).toBeEnabled()
  })
})
