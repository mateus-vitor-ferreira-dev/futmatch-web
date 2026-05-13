import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Intro, Register, Home,
  AdminUsers, AdminRequests, AdminPlaces,
  OwnerPlaces, OwnerRequests,
} from '../pages'

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
        <Route path="/login"    element={<PublicRoute><Register initialMode="login"    /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register initialMode="register" /></PublicRoute>} />

        {/* Usuário autenticado */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />

        {/* Painel Admin */}
        <Route path="/admin/users"    element={<AdminRoute><AdminUsers    /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/places"   element={<AdminRoute><AdminPlaces   /></AdminRoute>} />
        <Route path="/admin"          element={<Navigate to="/admin/users" replace />} />

        {/* Painel Owner */}
        <Route path="/owner/places"   element={<OwnerRoute><OwnerPlaces    /></OwnerRoute>} />
        <Route path="/owner/requests" element={<OwnerRoute><OwnerRequests  /></OwnerRoute>} />
        <Route path="/owner"          element={<Navigate to="/owner/places" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
