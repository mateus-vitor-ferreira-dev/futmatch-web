/**
 * Assinatura inativa em Meus Estabelecimentos.
 *
 * Esta tela era uma das quatro que **escondiam tudo**: o conteúdo ia a 25% e um
 * cartão de "Assinatura necessária" cobria a página — inclusive os contadores,
 * que dava para ver por trás dele, porque o portão carregava os dados e depois
 * os apagava.
 *
 * A regra do servidor é a outra: `requireActiveSubscription` só existe nos
 * `POST`/`PATCH`/`DELETE`. **Leitura é livre; escrita exige assinatura.** O que
 * este arquivo trava é isso, do lado da tela — e o motivo de importar: o dono
 * com pagamento atrasado precisa continuar vendo o próprio negócio justamente
 * para decidir se renova.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderWithProviders, screen } from '../../../test/render'
import OwnerPlaces from './index'

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

import * as placesService from '../../../services/places'

const arena = {
  id: 'place-1',
  ownerId: 'owner-1',
  name: 'Arena Um',
  city: 'Lavras',
  status: 'OPEN',
  _count: { courts: 2 },
}

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.isActive = true
  assinatura.loading = false
  vi.mocked(placesService.list).mockResolvedValue({ data: { data: [arena] } } as never)
})

describe('OwnerPlaces — assinatura inativa', () => {
  it('mantém o estabelecimento à vista e desabilita as ações que gravam', async () => {
    assinatura.isActive = false

    renderWithProviders(<OwnerPlaces />)

    // Leitura: o cartão continua na tela, com o que a API devolveu.
    expect(await screen.findByText('Arena Um')).toBeInTheDocument()
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()

    // Escrita: desabilitada, e não escondida.
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeDisabled()

    // Navegar não é gravar — estas três continuam valendo.
    expect(screen.getByRole('button', { name: 'Quadras' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Estoque' })).toBeEnabled()
  })

  it('com assinatura em dia, nada é avisado nem desabilitado', async () => {
    renderWithProviders(<OwnerPlaces />)

    expect(await screen.findByText('Arena Um')).toBeInTheDocument()
    expect(screen.queryByText(/pode consultar, mas precisa/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled()
  })

  it('enquanto o status não chegou, ninguém grava', async () => {
    // A proteção da #119: liberar o clique neste instante é o que fazia o dono
    // preencher o formulário inteiro para levar 402 no fim.
    assinatura.loading = true

    renderWithProviders(<OwnerPlaces />)

    expect(await screen.findByText('Verificando assinatura…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
  })
})
