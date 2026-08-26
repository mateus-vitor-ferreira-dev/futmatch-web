import { Suspense, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MainLayout from '../components/MainLayout'
import DashboardLayout from '../components/DashboardLayout'
import { ownerNavItems } from '../constants/navItems'
import { useSubscription } from '../hooks/useSubscription'


/**
 * Fallback das rotas que não têm layout (login, cadastro, intro).
 *
 * As rotas de dentro do app não usam este: cada layout tem o próprio
 * `<Suspense>` com `ContentLoader`, que preserva sidebar e topbar na troca de
 * rota. Antes da #197 este spinner de tela cheia cobria o app inteiro a cada
 * navegação.
 */
export function FullPageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function PublicRoute({ children }: { children: ReactNode }) {
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
export function PrivateRoute({ children }: { children: ReactNode }) {
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
export function PartidaShell() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <MainLayout />

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Outlet />
    </Suspense>
  )
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <>{children}</>
}

export function OwnerRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <>{children}</>
}

/** Layout do painel do owner, com o menu que depende do papel e do plano. */
export function OwnerPanelLayout() {
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

