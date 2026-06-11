import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Intro, Register, Home, Profile,
  ForgotPassword, ResetPassword,
  AdminUsers, AdminRequests, AdminPlaces, AdminDashboard,
  OwnerPlaces, OwnerRequests, OwnerDashboard,
  QueroJogar, MinhasPeladas, Historico,
  CriarPelada, Tournaments, Avaliacoes,
} from '../pages'

// [MANTENHA IntroRoute, PublicRoute, PrivateRoute, AdminRoute, OwnerRoute EXATAMENTE IGUAIS]

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
      <Routes>
        {/* Público */}
        <Route path="/" element={<IntroRoute />} />
        <Route path="/login"            element={<PublicRoute><Register initialMode="login"    /></PublicRoute>} />
        <Route path="/register"         element={<PublicRoute><Register initialMode="register" /></PublicRoute>} />
        <Route path="/esqueci-senha"    element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/redefinir-senha"  element={<PublicRoute><ResetPassword  /></PublicRoute>} />

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
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> {/* NOVA ROTA */}
        <Route path="/admin/users"     element={<AdminRoute><AdminUsers    /></AdminRoute>} />
        <Route path="/admin/requests"  element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/places"    element={<AdminRoute><AdminPlaces   /></AdminRoute>} />
        {/* Agora o fallback do /admin joga para o Dashboard (Visão Geral) */}
        <Route path="/admin"           element={<Navigate to="/admin/dashboard" replace />} /> 

        {/* Painel Owner */}
        <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} /> {/* NOVA ROTA */}
        <Route path="/owner/places"    element={<OwnerRoute><OwnerPlaces   /></OwnerRoute>} />
        <Route path="/owner/requests"  element={<OwnerRoute><OwnerRequests /></OwnerRoute>} />
        <Route path="/owner"           element={<Navigate to="/owner/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}