import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Intro, Register, Home } from '../pages'

/**
 * Exibe a tela de intro e navega para /login ao terminar a animação.
 */
function IntroRoute() {
  const navigate = useNavigate()
  return <Intro onComplete={() => navigate('/login')} />
}

/**
 * Rota pública: bloqueia acesso se o usuário já estiver autenticado.
 * Redireciona para /home caso já logado.
 *
 * @param {{ children: React.ReactNode }} props
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Navigate to="/home" replace /> : children
}

/**
 * Rota privada: exige autenticação para acessar.
 * Redireciona para /login caso não autenticado.
 *
 * @param {{ children: React.ReactNode }} props
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/**
 * Configuração central de rotas da aplicação.
 *
 * Fluxo:
 *   /          → Intro (animação) → redireciona para /login
 *   /login     → Formulário de login (público)
 *   /register  → Formulário de cadastro (público)
 *   /home      → Página inicial (privada)
 *   *          → Redireciona para /login
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroRoute />} />

        <Route path="/login" element={
          <PublicRoute><Register initialMode="login" /></PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute><Register initialMode="register" /></PublicRoute>
        } />

        <Route path="/home" element={
          <PrivateRoute><Home /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
