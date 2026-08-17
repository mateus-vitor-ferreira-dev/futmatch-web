/**
 * Assinatura inativa na tela de Quadras.
 *
 * Além de ser uma das quatro que escondiam tudo, esta tinha um detalhe próprio:
 * o **"+ Nova Quadra" mora fora do portão**. Com a assinatura vencida, o
 * conteúdo abaixo era apagado e o botão continuava clicável — abrindo um modal
 * dentro da parte apagada.
 *
 * A regra que vale aqui é a do servidor: leitura livre, escrita exigindo
 * assinatura. Estes casos travam as duas metades disso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderWithProviders, screen } from '../../../test/render'
import OwnerCourts from './index'

const assinatura = vi.hoisted(() => ({ isActive: true, loading: false }))

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
}))
// `importOriginal` porque o SubscriptionGate importa `diasDeToleranciaRestantes`
// deste mesmo módulo.
vi.mock('../../../hooks/useSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../hooks/useSubscription')>()),
  useSubscription: () => ({
    sub: null,
    ...assinatura,
    podeAlterar: assinatura.isActive && !assinatura.loading,
  }),
}))
vi.mock('../../../components/DashboardLayout/pageHeader', () => ({
  usePageHeader: () => {},
  PageActions: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../../services/places')
vi.mock('../../../services/courts')

import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'

const quadra = {
  id: 'court-1',
  placeId: 'place-1',
  name: 'Quadra Coberta',
  type: 'FUTSAL',
  status: 'OPEN',
}

function renderiza() {
  return renderWithProviders(<OwnerCourts />, {
    route: '/owner/places/place-1/courts',
    path: '/owner/places/:placeId/courts',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.isActive = true
  assinatura.loading = false
  vi.mocked(placesService.getOne).mockResolvedValue({ data: { data: { id: 'place-1', name: 'Arena Um' } } } as never)
  vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [quadra] } as never)
})

describe('OwnerCourts — assinatura inativa', () => {
  it('mantém a quadra à vista e desabilita as ações que gravam', async () => {
    assinatura.isActive = false

    renderiza()

    expect(await screen.findByText('Quadra Coberta')).toBeInTheDocument()
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled()
  })

  it('desabilita o "+ Nova Quadra", que fica fora do portão', async () => {
    assinatura.isActive = false

    renderiza()

    await screen.findByText('Quadra Coberta')
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeDisabled()
  })

  it('com assinatura em dia, nada é avisado nem desabilitado', async () => {
    renderiza()

    expect(await screen.findByText('Quadra Coberta')).toBeInTheDocument()
    expect(screen.queryByText(/pode consultar, mas precisa/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
  })

  it('enquanto o status não chegou, ninguém grava', async () => {
    // A proteção da #119 precisa valer aqui também.
    assinatura.loading = true

    renderiza()

    expect(await screen.findByText('Verificando assinatura…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeDisabled()
  })
})
