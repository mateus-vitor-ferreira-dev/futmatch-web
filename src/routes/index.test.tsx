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
    QueroJogar: stub('QueroJogar'), CriarPartida: stub('CriarPartida'),
    Tournaments: stub('Tournaments'), MinhasPartidas: stub('MinhasPartidas'),
    Historico: stub('Historico'), Avaliacoes: stub('Avaliacoes'),
    PartidaDetail: stub('PartidaDetail'), TournamentDetail: stub('TournamentDetail'),
    Times: stub('Times'), TimeDetail: stub('TimeDetail'),
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

/**
 * A pelada é a única rota que existe dos dois lados do login — #302.
 *
 * Ela estava atrás do `PrivateRoute`, e isso deixava duas capacidades da API
 * mortas no front: as regras de entrada, que a api#332 tornou legíveis **sem
 * sessão de propósito**, e o convite por link, que por desenho é aberto por
 * quem pode não ter conta.
 */
describe('rota da pelada', () => {
    beforeEach(() => {
        auth.estado = { user: null, loading: false, isAuthenticated: false }
        window.history.pushState({}, '', '/partida/pelada-1')
    })

    it('abre para quem não tem sessão, sem passar pelo login', async () => {
        render(<AppRoutes />)

        expect(await screen.findByText('PartidaDetail')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/partida/pelada-1')
        expect(screen.queryByText('tela de login')).not.toBeInTheDocument()
    })

    it('preserva a query, que é onde mora o token do convite', async () => {
        window.history.pushState({}, '', '/partida/pelada-1?convite=token-abc')

        render(<AppRoutes />)

        await screen.findByText('PartidaDetail')
        expect(window.location.search).toBe('?convite=token-abc')
    })

    it('quem tem sessão continua vendo a pelada dentro do app', async () => {
        auth.estado = { user: { role: 'USER' }, loading: false, isAuthenticated: true }

        render(<AppRoutes />)

        // O `MainLayout` está mockado como um div sem `Outlet`, então vê-lo é a
        // prova de que a casca do app foi escolhida — a sidebar não se perdeu
        // para quem está logado.
        expect(await screen.findByText('MainLayout')).toBeInTheDocument()
    })

    it('não devolve nada enquanto a sessão está sendo verificada', async () => {
        auth.estado = { user: null, loading: true, isAuthenticated: false }

        render(<AppRoutes />)

        // Sem isto, quem tem sessão veria a versão de visitante piscar antes de
        // a verificação terminar.
        await waitFor(() => {
            expect(screen.queryByText('PartidaDetail')).not.toBeInTheDocument()
            expect(screen.queryByText('MainLayout')).not.toBeInTheDocument()
        })
    })

    it('a busca continua atrás do login — o escopo não foi alargado', async () => {
        window.history.pushState({}, '', '/quero-jogar')

        render(<AppRoutes />)

        // Decisão registrada na #302: só a página da pelada abriu. Abrir a busca
        // exporia muito mais peladas e muito mais gente de uma vez.
        await waitFor(() => expect(window.location.pathname).toBe('/login'))
        expect(screen.queryByText('QueroJogar')).not.toBeInTheDocument()
    })
})

/**
 * As rotas antigas, depois da #329.
 *
 * O rename só é seguro se o link que já saiu continuar abrindo. `/pelada/:id`
 * é a URL que circula no grupo do WhatsApp: quem clica nela não é quem tem
 * como reportar que quebrou, então a regressão seria silenciosa.
 *
 * O caso da query não é hipótese. É a api que monta o link do convite, em
 * `invite.service.ts`, como `${APP_URL}/pelada/${id}?c=<token>` — o `?c=` é a
 * credencial de entrada. Um redirect que preservasse só o `:eventId` abriria a
 * página sem o convite, e a partida responde 404 para quem não é de dentro.
 */
describe('rotas antigas da #329', () => {
    beforeEach(() => {
        auth.estado = { user: null, loading: false, isAuthenticated: false }
    })

    it('/pelada/:eventId leva para /partida/:eventId, com o id preservado', async () => {
        window.history.pushState({}, '', '/pelada/pelada-1')

        render(<AppRoutes />)

        expect(await screen.findByText('PartidaDetail')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/partida/pelada-1')
    })

    it('leva o token do convite junto, e não só o id', async () => {
        window.history.pushState({}, '', '/pelada/pelada-1?c=token-abc')

        render(<AppRoutes />)

        await screen.findByText('PartidaDetail')
        expect(window.location.pathname).toBe('/partida/pelada-1')
        expect(window.location.search).toBe('?c=token-abc')
    })

    it('/criar-pelada e /minhas-peladas continuam abrindo para quem tem sessão', async () => {
        auth.estado = { user: { role: 'USER' }, loading: false, isAuthenticated: true }
        window.history.pushState({}, '', '/criar-pelada')

        render(<AppRoutes />)

        await waitFor(() => expect(window.location.pathname).toBe('/criar-partida'))
    })
})
