/**
 * Comportamento da rota raiz.
 *
 * Até a #225, `/` era uma intro animada de 4 segundos sem guarda de primeira
 * visita nem botão de pular: todo visitante pagava, e quem já estava logado
 * pagava e ainda passava por `/login` antes de o `PublicRoute` mandá-lo para a
 * área dele — quatro segundos e duas navegações para chegar onde já podia estar.
 *
 * Estes testes fixam as duas pontas do que ficou no lugar. São o que falha se
 * alguém reintroduzir uma etapa intermediária na raiz.
 *
 * `./paginas` é mockado inteiro: o alvo aqui é a decisão de rota, não o
 * conteúdo das telas. Com os stubs, o teste não depende de lazy chunk nem do
 * que cada página busca ao montar.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const auth = vi.hoisted(() => ({
  estado: { user: null as { role: string } | null, loading: false, isAuthenticated: false },
}))

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => auth.estado,
}))

vi.mock('./paginas', () => {
  const stub = (nome: string) => () => <div>{nome}</div>
  return {
    Register: ({ initialMode }: { initialMode?: string }) => <div>tela de {initialMode}</div>,
    ForgotPassword: stub('ForgotPassword'), ResetPassword: stub('ResetPassword'),
    OwnerAccess: stub('OwnerAccess'), Home: stub('Home'), Profile: stub('Profile'),
    QueroJogar: stub('QueroJogar'), CriarPelada: stub('CriarPelada'),
    Tournaments: stub('Tournaments'), MinhasPeladas: stub('MinhasPeladas'),
    Historico: stub('Historico'), Avaliacoes: stub('Avaliacoes'),
    PeladaDetail: stub('PeladaDetail'), TournamentDetail: stub('TournamentDetail'),
    AdminDashboard: stub('AdminDashboard'), AdminUsers: stub('AdminUsers'),
    AdminRequests: stub('AdminRequests'), AdminPlaces: stub('AdminPlaces'),
    OwnerDashboard: stub('OwnerDashboard'), OwnerPlans: stub('OwnerPlans'),
    OwnerPlaces: stub('OwnerPlaces'), OwnerInventory: stub('OwnerInventory'),
    OwnerEquipment: stub('OwnerEquipment'), OwnerRequests: stub('OwnerRequests'),
    OwnerCourts: stub('OwnerCourts'),
  }
})

vi.mock('../components/MainLayout', () => ({ default: () => <div>MainLayout</div> }))
vi.mock('../components/DashboardLayout', () => ({ default: () => <div>DashboardLayout</div> }))

import AppRoutes from './index'

describe('rota raiz', () => {
    beforeEach(() => {
        auth.estado = { user: null, loading: false, isAuthenticated: false }
        window.history.pushState({}, '', '/')
    })

    it('mostra o login direto para quem não está autenticado', async () => {
        render(<AppRoutes />)
        expect(await screen.findByText('tela de login')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/')
    })

    it('manda o jogador logado para a área dele sem etapa intermediária', async () => {
        auth.estado = { user: { role: 'USER' }, loading: false, isAuthenticated: true }
        render(<AppRoutes />)
        await waitFor(() => expect(window.location.pathname).toBe('/home'))
        // Nunca passa pelo login: o redirect sai da própria raiz.
        expect(screen.queryByText('tela de login')).not.toBeInTheDocument()
    })

    it('manda o dono para o painel dele', async () => {
        auth.estado = { user: { role: 'OWNER' }, loading: false, isAuthenticated: true }
        render(<AppRoutes />)
        await waitFor(() => expect(window.location.pathname).toBe('/owner'))
    })

    it('manda o admin para o painel dele', async () => {
        auth.estado = { user: { role: 'ADMIN' }, loading: false, isAuthenticated: true }
        render(<AppRoutes />)
        await waitFor(() => expect(window.location.pathname).toBe('/admin'))
    })
})
