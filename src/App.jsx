import { ThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { theme } from './styles/theme'
import GlobalStyles from './styles/global'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes'
import { env } from './config/env'

// GoogleOAuthProvider requer clientId não-vazio para inicializar.
// Quando não configurado, usamos um placeholder — o botão do Google
// ficará desabilitado até que VITE_GOOGLE_CLIENT_ID seja definido.
const GOOGLE_CLIENT_ID = env.googleClientId || 'not-configured'

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
