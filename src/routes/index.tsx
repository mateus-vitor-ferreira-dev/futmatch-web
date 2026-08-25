import { Suspense, useMemo } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MainLayout from '../components/MainLayout'
import DashboardLayout from '../components/DashboardLayout'
import { adminNavItems, ownerNavItems } from '../constants/navItems'
import { useSubscription } from '../hooks/useSubscription'
import PlanGate from '../components/PlanGate'
import {
  Register, ForgotPassword, ResetPassword, OwnerAccess,
  Home, Profile, QueroJogar, CriarPartida, Tournaments, MinhasPartidas,
  Historico, Avaliacoes, PartidaDetail, TournamentDetail, Times, TimeDetail,
  AdminDashboard, AdminUsers, AdminRequests, AdminPlaces,
  OwnerDashboard, OwnerPlans, OwnerPlaces, OwnerInventory, OwnerEquipment, OwnerRequests, OwnerCourts,
} from './paginas'


/**
 * Fallback das rotas que não têm layout (login, cadastro, intro).
 *
 * As rotas de dentro do app não usam este: cada layout tem o próprio
 * `<Suspense>` com `ContentLoader`, que preserva sidebar e topbar na troca de
 * rota. Antes da #197 este spinner de tela cheia cobria o app inteiro a cada
 * navegação.
 */
function FullPageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <>{children}</>
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/home" replace />
}

/**
 * Guardas de rota.
 *
 * Recebem `children` para poderem embrulhar a rota-pai de layout: o elemento
 * da rota passa a ser `<PrivateRoute><MainLayout /></PrivateRoute>`, de modo
 * que a verificação de papel acontece **antes** de o layout montar. Sem isso,
 * a sidebar apareceria por um instante para quem não tem acesso.
 */
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * A página da partida é a única rota que existe **dos dois lados do login**.
 *
 * Ela precisa abrir para quem não tem conta: é o que o convite por link promete
 * (api#225), e é o que deixa as regras de entrada serem lidas antes do cadastro
 * (api#332). Ver a #302.
 *
 * Quem tem sessão continua vendo a partida dentro do app, com a sidebar. Quem
 * não tem vê a página sozinha — o menu do `MainLayout` só leva a lugares que
 * exigem login, e oferecê-lo a um visitante seria uma fila de becos sem saída.
 */
/**
 * As rotas antigas continuam abrindo (#329).
 *
 * `/pelada/:eventId` é a URL que o jogador cola no grupo do WhatsApp. Ela já
 * saiu, e quem clica nela não é quem tem como reportar que quebrou — link morto
 * é a regressão que ninguém vê acontecer. O `:eventId` é preservado.
 *
 * **Estes redirects podem sair, e é a api que dita quando** (api#407).
 *
 * Eles atendem só o que é genuinamente passado: link de WhatsApp já colado e
 * e-mail já entregue. Nada mais os produz — a api#400 fez o `linkDe` emitir
 * `/partida`, e a api#407 apontou os dois botões de e-mail para
 * `/minhas-partidas`.
 *
 * Isso não foi sempre verdade, e a diferença importa: até a api#407, dois
 * templates de e-mail montavam `/minhas-peladas` a cada entrada confirmada e a
 * cada lembrete diário. Enquanto isso durou, remover estes redirects teria
 * quebrado o botão de e-mail que o produto **ainda estava enviando** — sem
 * quebrar teste nenhum, porque nada aqui liga e-mail a rota.
 *
 * Antes de removê-los, confira que continua valendo: `grep -rn 'appUrl}/' ` no
 * `so-mais-um-api` não pode devolver caminho que só exista aqui como redirect.
 * O teste `emailTemplates-caminhos.test.ts` de lá é quem segura isso hoje.
 *
 * `Navigate` sozinho não serve aqui: ele não interpola parâmetro de rota, e
 * mandaria o visitante para a string literal `/partida/:eventId`.
 *
 * A query string vai junto, e isso não é zelo: o convite por link chega como
 * `/pelada/<id>?convite=<token>` — é a api que monta essa URL, em
 * `invite.service.ts` —, e o `?convite=` é a credencial de entrada. Redirect que só preserva o `:eventId`
 * abre a página e perde o convite, com a partida respondendo 404 para quem não
 * é de dentro. O `hash` vai pelo mesmo motivo: custa nada e não se perde.
 */
function RedirecionaParaPartida() {
  const { eventId } = useParams()
  const { search, hash } = useLocation()
  return <Navigate to={`/partida/${eventId}${search}${hash}`} replace />
}

function PartidaShell() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <MainLayout />

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Outlet />
    </Suspense>
  )
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <>{children}</>
}

function OwnerRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <>{children}</>
}

/** Layout do painel do owner, com o menu que depende do papel e do plano. */
function OwnerPanelLayout() {
  const { user } = useAuth()
  const { temFuncionalidade, loading } = useSubscription()

  // `ownerNavItems` monta um array novo a cada chamada; sem o memo, o layout
  // recalcularia os badges do menu a cada render.
  //
  // Enquanto o status não chega, nada é marcado como bloqueado: piscar o cadeado
  // e tirá-lo meio segundo depois é pior do que mostrar o menu inteiro por um
  // instante, e quem clicar antes da hora encontra o portão da própria página.
  const navItems = useMemo(
    () => ownerNavItems(user?.role, loading ? undefined : temFuncionalidade),
    [user?.role, loading, temFuncionalidade],
  )
  return <DashboardLayout navItems={navItems} tagline="Owner Panel" accent="#f59e0b" />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público — sem layout, fallback de tela cheia */}
        {/* A raiz é o login. Até a #225 ela era uma intro animada de 4s que todo
            mundo pagava, inclusive quem já estava logado — que ainda passava por
            /login antes de o PublicRoute mandá-lo para a área dele. */}
        <Route path="/"                element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="login"    /></PublicRoute></Suspense>} />
        <Route path="/login"           element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="login"    /></PublicRoute></Suspense>} />
        <Route path="/register"        element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="register" /></PublicRoute></Suspense>} />
        <Route path="/esqueci-senha"   element={<Suspense fallback={<FullPageLoader />}><PublicRoute><ForgotPassword /></PublicRoute></Suspense>} />
        <Route path="/redefinir-senha" element={<Suspense fallback={<FullPageLoader />}><PublicRoute><ResetPassword  /></PublicRoute></Suspense>} />
        <Route path="/seja-parceiro"   element={<Suspense fallback={<FullPageLoader />}><OwnerAccess /></Suspense>} />

        {/* Área do jogador — MainLayout monta uma vez e persiste entre estas rotas */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/home"            element={<Home />} />
          <Route path="/perfil"          element={<Profile />} />
          <Route path="/quero-jogar"     element={<QueroJogar />} />
          <Route path="/criar-partida"    element={<CriarPartida />} />
          <Route path="/torneios"        element={<Tournaments />} />
          <Route path="/torneios/:id"    element={<TournamentDetail />} />
          <Route path="/minhas-partidas"  element={<MinhasPartidas />} />
          <Route path="/historico"       element={<Historico />} />
          <Route path="/avaliacoes"      element={<Avaliacoes />} />
          <Route path="/times"           element={<Times />} />
          <Route path="/times/:teamId"   element={<TimeDetail />} />
        </Route>

        {/* Painel Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardLayout navItems={adminNavItems} tagline="Admin Panel" accent="#16a34a" />
            </AdminRoute>
          }
        >
          <Route index               element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="requests"     element={<AdminRequests />} />
          <Route path="places"       element={<AdminPlaces />} />
        </Route>

        {/* Painel Owner */}
        <Route path="/owner" element={<OwnerRoute><OwnerPanelLayout /></OwnerRoute>}>
          <Route index                      element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard"           element={<OwnerDashboard />} />
          <Route path="plans"               element={<OwnerPlans />} />
          <Route path="places"              element={<OwnerPlaces />} />
          <Route path="places/:placeId/courts" element={<OwnerCourts />} />
          {/* O portão fica na rota, e não só dentro da página: sem isso, chegar pela
              URL abriria a tela que o menu marca com cadeado. A API recusa de qualquer
              jeito, mas o dono veria a tela montar e as chamadas falharem uma a uma. */}
          <Route path="inventory"           element={<PlanGate funcionalidade="ESTOQUE"><OwnerInventory /></PlanGate>} />
          <Route path="equipment"           element={<PlanGate funcionalidade="EQUIPAMENTOS"><OwnerEquipment /></PlanGate>} />
          <Route path="requests"            element={<OwnerRequests />} />
        </Route>

        {/* Fallback */}
        {/* Fora do bloco privado de propósito — ver `PartidaShell`. A rota
            precisa vir antes do catch-all, que manda tudo para o login. */}
        <Route element={<PartidaShell />}>
          <Route path="/partida/:eventId" element={<PartidaDetail />} />
        </Route>

        {/* Rotas antigas, só para link que já saiu — ver `RedirecionaParaPartida`.
            Navegação nova aponta direto para o nome novo; nenhum link interno
            passa por aqui. */}
        <Route path="/pelada/:eventId"  element={<RedirecionaParaPartida />} />
        <Route path="/criar-pelada"     element={<Navigate to="/criar-partida" replace />} />
        <Route path="/minhas-peladas"   element={<Navigate to="/minhas-partidas" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
