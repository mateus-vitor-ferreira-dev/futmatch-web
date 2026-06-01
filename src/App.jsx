import { ThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { theme } from './styles/theme'
import GlobalStyles from './styles/global'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes'
import { env } from './config/env'

// GoogleOAuthProvider exige um clientId não-vazio para inicializar.
// O placeholder garante que o app não quebre quando VITE_GOOGLE_CLIENT_ID
// não estiver configurado — o botão do Google ficará desabilitado.
const GOOGLE_CLIENT_ID = env.googleClientId || 'not-configured'

/**
 * Componente raiz da aplicação.
 *
 * Ordem dos providers (de fora para dentro):
 *  1. GoogleOAuthProvider — inicializa o SDK do Google OAuth
 *  2. ThemeProvider       — injeta o tema (cores, fontes, espaçamentos) via styled-components
 *  3. AuthProvider        — gerencia estado de autenticação global
 *  4. GlobalStyles        — reset CSS e estilos base
 *  5. AppRoutes           — árvore de rotas da aplicação
 */
export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <GlobalStyles />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
