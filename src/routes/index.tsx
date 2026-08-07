import { lazy, Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Recarrega a página automaticamente quando um chunk antigo não é encontrado após um novo deploy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(
  fn: () => Promise<{ default: T }>,
) {
  return lazy(() => fn().catch(() => {
    window.location.reload()
    // Promise que nunca resolve: a página está recarregando de qualquer forma.
    return new Promise<{ default: T }>(() => {})
  }))
}

const Intro          = lazyWithRetry(() => import('../pages/Intro'))
const Register       = lazyWithRetry(() => import('../pages/Register'))
const Home           = lazyWithRetry(() => import('../pages/Home'))
const Profile        = lazyWithRetry(() => import('../pages/Profile'))
const ForgotPassword = lazyWithRetry(() => import('../pages/ForgotPassword'))
const ResetPassword  = lazyWithRetry(() => import('../pages/ResetPassword'))
const QueroJogar     = lazyWithRetry(() => import('../pages/QueroJogar'))
const MinhasPeladas  = lazyWithRetry(() => import('../pages/MinhasPeladas'))
const Historico      = lazyWithRetry(() => import('../pages/Historico'))
const CriarPelada    = lazyWithRetry(() => import('../pages/CriarPelada'))
const Tournaments    = lazyWithRetry(() => import('../pages/Tournaments'))
const Avaliacoes     = lazyWithRetry(() => import('../pages/Avaliacoes'))
const PeladaDetail        = lazyWithRetry(() => import('../pages/PeladaDetail'))
const TournamentDetail    = lazyWithRetry(() => import('../pages/TournamentDetail'))
const AdminDashboard = lazyWithRetry(() => import('../pages/Admin/Dashboard'))
const AdminUsers     = lazyWithRetry(() => import('../pages/Admin/Users'))
const AdminRequests  = lazyWithRetry(() => import('../pages/Admin/Requests'))
const AdminPlaces    = lazyWithRetry(() => import('../pages/Admin/Places'))
const OwnerDashboard = lazyWithRetry(() => import('../pages/Owner/Dashboard'))
const OwnerPlaces    = lazyWithRetry(() => import('../pages/Owner/Places'))
const OwnerRequests  = lazyWithRetry(() => import('../pages/Owner/Requests'))
const OwnerCourts    = lazyWithRetry(() => import('../pages/Owner/Courts'))
const OwnerInventory = lazyWithRetry(() => import('../pages/Owner/Inventory'))
const OwnerEquipment = lazyWithRetry(() => import('../pages/Owner/Equipment'))
const OwnerAccess    = lazyWithRetry(() => import('../pages/OwnerAccess'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function IntroRoute() {
  const navigate = useNavigate()
  return <Intro onComplete={() => navigate('/login')} />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <>{children}</>
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/home" replace />
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
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

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Público */}
          <Route path="/"                element={<IntroRoute />} />
          <Route path="/login"           element={<PublicRoute><Register initialMode="login"    /></PublicRoute>} />
          <Route path="/register"        element={<PublicRoute><Register initialMode="register" /></PublicRoute>} />
          <Route path="/esqueci-senha"   element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/redefinir-senha" element={<PublicRoute><ResetPassword  /></PublicRoute>} />
          <Route path="/seja-parceiro"  element={<OwnerAccess />} />

          {/* Usuário autenticado (Jogador) */}
          <Route path="/home"           element={<PrivateRoute><Home          /></PrivateRoute>} />
          <Route path="/perfil"         element={<PrivateRoute><Profile       /></PrivateRoute>} />
          <Route path="/quero-jogar"    element={<PrivateRoute><QueroJogar    /></PrivateRoute>} />
          <Route path="/criar-pelada"   element={<PrivateRoute><CriarPelada   /></PrivateRoute>} />
          <Route path="/torneios"       element={<PrivateRoute><Tournaments       /></PrivateRoute>} />
          <Route path="/torneios/:id"   element={<PrivateRoute><TournamentDetail  /></PrivateRoute>} />
          <Route path="/minhas-peladas" element={<PrivateRoute><MinhasPeladas /></PrivateRoute>} />
          <Route path="/historico"      element={<PrivateRoute><Historico     /></PrivateRoute>} />
          <Route path="/avaliacoes"     element={<PrivateRoute><Avaliacoes    /></PrivateRoute>} />
          <Route path="/pelada/:eventId" element={<PrivateRoute><PeladaDetail  /></PrivateRoute>} />

          {/* Painel Admin */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"     element={<AdminRoute><AdminUsers     /></AdminRoute>} />
          <Route path="/admin/requests"  element={<AdminRoute><AdminRequests  /></AdminRoute>} />
          <Route path="/admin/places"    element={<AdminRoute><AdminPlaces    /></AdminRoute>} />
          <Route path="/admin"           element={<Navigate to="/admin/dashboard" replace />} />

          {/* Painel Owner */}
          <Route path="/owner/dashboard"              element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
          <Route path="/owner/places"               element={<OwnerRoute><OwnerPlaces    /></OwnerRoute>} />
          <Route path="/owner/places/:placeId/courts" element={<OwnerRoute><OwnerCourts  /></OwnerRoute>} />
          <Route path="/owner/inventory"              element={<OwnerRoute><OwnerInventory /></OwnerRoute>} />
          <Route path="/owner/equipment"             element={<OwnerRoute><OwnerEquipment /></OwnerRoute>} />
          <Route path="/owner/requests"             element={<OwnerRoute><OwnerRequests  /></OwnerRoute>} />
          <Route path="/owner"                      element={<Navigate to="/owner/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
