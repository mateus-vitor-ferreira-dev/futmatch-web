import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Intro          = lazy(() => import('../pages/Intro'))
const Register       = lazy(() => import('../pages/Register'))
const Home           = lazy(() => import('../pages/Home'))
const Profile        = lazy(() => import('../pages/Profile'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('../pages/ResetPassword'))
const QueroJogar     = lazy(() => import('../pages/QueroJogar'))
const MinhasPeladas  = lazy(() => import('../pages/MinhasPeladas'))
const Historico      = lazy(() => import('../pages/Historico'))
const CriarPelada    = lazy(() => import('../pages/CriarPelada'))
const Tournaments    = lazy(() => import('../pages/Tournaments'))
const Avaliacoes     = lazy(() => import('../pages/Avaliacoes'))
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard'))
const AdminUsers     = lazy(() => import('../pages/Admin/Users'))
const AdminRequests  = lazy(() => import('../pages/Admin/Requests'))
const AdminPlaces    = lazy(() => import('../pages/Admin/Places'))
const OwnerDashboard = lazy(() => import('../pages/Owner/Dashboard'))
const OwnerPlaces    = lazy(() => import('../pages/Owner/Places'))
const OwnerRequests  = lazy(() => import('../pages/Owner/Requests'))

function IntroRoute() {
  const navigate = useNavigate()
  return <Intro onComplete={() => navigate('/login')} />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return children
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'OWNER') return <Navigate to="/owner" replace />
  return <Navigate to="/home" replace />
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return children
}

function OwnerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* Público */}
          <Route path="/"                element={<IntroRoute />} />
          <Route path="/login"           element={<PublicRoute><Register initialMode="login"    /></PublicRoute>} />
          <Route path="/register"        element={<PublicRoute><Register initialMode="register" /></PublicRoute>} />
          <Route path="/esqueci-senha"   element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/redefinir-senha" element={<PublicRoute><ResetPassword  /></PublicRoute>} />

          {/* Usuário autenticado (Jogador) */}
          <Route path="/home"           element={<PrivateRoute><Home          /></PrivateRoute>} />
          <Route path="/perfil"         element={<PrivateRoute><Profile       /></PrivateRoute>} />
          <Route path="/quero-jogar"    element={<PrivateRoute><QueroJogar    /></PrivateRoute>} />
          <Route path="/criar-pelada"   element={<PrivateRoute><CriarPelada   /></PrivateRoute>} />
          <Route path="/torneios"       element={<PrivateRoute><Tournaments   /></PrivateRoute>} />
          <Route path="/minhas-peladas" element={<PrivateRoute><MinhasPeladas /></PrivateRoute>} />
          <Route path="/historico"      element={<PrivateRoute><Historico     /></PrivateRoute>} />
          <Route path="/avaliacoes"     element={<PrivateRoute><Avaliacoes    /></PrivateRoute>} />

          {/* Painel Admin */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"     element={<AdminRoute><AdminUsers     /></AdminRoute>} />
          <Route path="/admin/requests"  element={<AdminRoute><AdminRequests  /></AdminRoute>} />
          <Route path="/admin/places"    element={<AdminRoute><AdminPlaces    /></AdminRoute>} />
          <Route path="/admin"           element={<Navigate to="/admin/dashboard" replace />} />

          {/* Painel Owner */}
          <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
          <Route path="/owner/places"    element={<OwnerRoute><OwnerPlaces    /></OwnerRoute>} />
          <Route path="/owner/requests"  element={<OwnerRoute><OwnerRequests  /></OwnerRoute>} />
          <Route path="/owner"           element={<Navigate to="/owner/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
