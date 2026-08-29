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
    OwnerCourts: stub('OwnerCourts'), OwnerProfessores: stub('OwnerProfessores'),
    ConviteDeProfessor: stub('ConviteDeProfessor'),
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
 * A partida é a única rota que existe dos dois lados do login — #302.
 *
 * Ela estava atrás do `PrivateRoute`, e isso deixava duas capacidades da API
 * mortas no front: as regras de entrada, que a api#332 tornou legíveis **sem
 * sessão de propósito**, e o convite por link, que por desenho é aberto por
 * quem pode não ter conta.
 */
describe('rota da partida', () => {
    beforeEach(() => {
        auth.estado = { user: null, loading: false, isAuthenticated: false }
        window.history.pushState({}, '', '/partida/partida-1')
    })

    it('abre para quem não tem sessão, sem passar pelo login', async () => {
        render(<AppRoutes />)

        expect(await screen.findByText('PartidaDetail')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/partida/partida-1')
        expect(screen.queryByText('tela de login')).not.toBeInTheDocument()
    })

    it('preserva a query, que é onde mora o token do convite', async () => {
        window.history.pushState({}, '', '/partida/partida-1?convite=token-abc')

        render(<AppRoutes />)

        await screen.findByText('PartidaDetail')
        expect(window.location.search).toBe('?convite=token-abc')
    })

    it('quem tem sessão continua vendo a partida dentro do app', async () => {
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

        // Decisão registrada na #302: só a página da partida abriu. Abrir a busca
        // exporia muito mais partidas e muito mais gente de uma vez.
        await waitFor(() => expect(window.location.pathname).toBe('/login'))
        expect(screen.queryByText('QueroJogar')).not.toBeInTheDocument()
    })
})

/**
 * As rotas antigas não existem mais.
 *
 * Elas eram a rede de compatibilidade do rename (#329): `/pelada/:id` é a URL
 * que circulava no grupo do WhatsApp, e quem clica nela não é quem tem como
 * reportar que quebrou. A rede caiu porque o produto ainda não tem link antigo
 * circulando — a api só emite `/partida/:id` e `/minhas-partidas`, e o
 * `emailTemplates-caminhos.test.ts` de lá é quem segura isso.
 *
 * O caso testa o **destino**, e não a ausência da rota: sem redirect, o nome
 * antigo cai no catch-all e vai para o login. É esse o comportamento que muda
 * se alguém reintroduzir a rota sem querer.
 */
describe('as rotas antigas do rename saíram', () => {
    beforeEach(() => {
        auth.estado = { user: null, loading: false, isAuthenticated: false }
    })

    it.each(['/pelada/partida-1', '/criar-pelada', '/minhas-peladas'])(
        '%s cai no catch-all e vai para o login',
        async (caminhoAntigo) => {
            window.history.pushState({}, '', caminhoAntigo)

            render(<AppRoutes />)

            await waitFor(() => expect(window.location.pathname).toBe('/login'))
        },
    )

    it('o nome novo continua abrindo a partida, com o convite preservado', async () => {
        window.history.pushState({}, '', '/partida/partida-1?convite=token-abc')

        render(<AppRoutes />)

        expect(await screen.findByText('PartidaDetail')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/partida/partida-1')
        expect(window.location.search).toBe('?convite=token-abc')
    })
})
