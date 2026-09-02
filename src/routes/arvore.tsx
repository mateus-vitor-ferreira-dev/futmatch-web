import { Route, Navigate } from 'react-router-dom'

import {
  FullPageLoader, PublicRoute, PrivateRoute, PartidaShell,
  AdminRoute, OwnerRoute, OwnerPanelLayout,
} from './shells'
import { Suspense } from 'react'
import MainLayout from '../components/MainLayout'
import DashboardLayout from '../components/DashboardLayout'
import { adminNavItems } from '../constants/navItems'
import PlanGate from '../components/PlanGate'
import {
  Register, ForgotPassword, ResetPassword, OwnerAccess,
  Home, Profile, QueroJogar, CriarPartida, Tournaments, MinhasPartidas,
  Historico, Avaliacoes, PartidaDetail, TournamentDetail, Times, TimeDetail, Jogador, Amigos,
  ConviteDeProfessor,
  AdminDashboard, AdminUsers, AdminRequests, AdminPlaces,
  OwnerDashboard, OwnerPlans, OwnerPlaces, OwnerInventory, OwnerEquipment, OwnerRequests, OwnerCourts,
  OwnerProfessores,
  OwnerTurmas,
  OwnerAlunos,
  OwnerChamada,
} from './paginas'

/**
 * A árvore de rotas, fora do componente.
 *
 * Fica exportada porque é a **única fonte de verdade sobre quantas rotas o app
 * tem**, e o README anuncia esse número. Contá-lo por regex sobre este arquivo
 * é o erro que a api documentou em `verifica-numeros-do-readme.ts` — foi assim
 * que quatro issues inválidas nasceram lá. Com a árvore exportada,
 * `createRoutesFromElements` a percorre de verdade, e a conferência lê o que o
 * roteador leria.
 *
 * O `<Routes>` aceita um fragmento e recursa nele, então mover isto para cá
 * não muda o que é montado — só dá nome ao que já existia.
 */
export const arvoreDeRotas = (
  <>
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
    {/* O convite de professor (api#451). Fora do bloco privado de propósito: o
        `GET /place-invites/verify` é público, e quem ainda não tem conta precisa
        ver de quem é o convite antes de decidir se vale se cadastrar. */}
    <Route path="/convite-professor" element={<Suspense fallback={<FullPageLoader />}><ConviteDeProfessor /></Suspense>} />

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
      {/* Fica no menu, e não numa aba do perfil: perfil é onde se configura a
          conta, e amigos é onde se usa o produto. Ver o comentário da página. */}
      <Route path="/amigos"          element={<Amigos />} />
      {/* A página de outra pessoa (web#375). Autenticada: seguir exige sessão,
          e uma versão pública sem o botão seria a mesma tela sem o motivo dela. */}
      <Route path="/jogador/:userId" element={<Jogador />} />
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
      {/* Convites de professor (api#451). Sem `PlanGate`: a api deixou esta rota
          fora do `requireActiveSubscription` de propósito, e trancá-la aqui
          deixaria um dono adimplente de ontem sem dar acesso a quem já dá aula
          na quadra dele hoje.

          Sem `:placeId` no caminho: a tela está no menu, e menu não carrega
          parâmetro. O espaço vem do seletor, com `?placeId=` na URL — mesmo
          desenho do Estoque e dos Equipamentos. */}
      <Route path="professores"           element={<OwnerProfessores />} />
      {/* As turmas do espaço (api#472). Sem `PlanGate` pelo mesmo motivo dos
          professores: a api deixou estas rotas fora do
          `requireActiveSubscription` de propósito, e o cadeado aqui mandaria o
          dono para a tela de planos por uma coisa que ele já pode fazer.

          Sem `:placeId` no caminho, também pelo mesmo motivo: a tela está no
          menu, e o espaço vem do seletor com `?placeId=` na URL. */}
      <Route path="turmas"                element={<OwnerTurmas />} />
      {/* Os alunos de uma turma (api#474). Aqui o `:turmaId` **vai no caminho**:
          diferente da lista de turmas, esta tela não está no menu, então a
          regra de "menu não carrega parâmetro" não se aplica. O `placeId`
          continua na query, porque é dele que a api precisa na URL da rota. */}
      <Route path="turmas/:turmaId/alunos" element={<OwnerAlunos />} />
      <Route path="turmas/:turmaId/chamada" element={<OwnerChamada />} />
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

    <Route path="*" element={<Navigate to="/login" replace />} />
  </>
)
