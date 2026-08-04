import { ThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/global'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeContextProvider, useThemeMode } from './contexts/ThemeContext'
import AppRoutes from './routes'
import ErrorBoundary from './components/ErrorBoundary'
import { env } from './config/env'

const GOOGLE_CLIENT_ID = env.googleClientId || 'not-configured'

function ThemedApp() {
  const { isDark } = useThemeMode()
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <ErrorBoundary>
        <AuthProvider>
          <GlobalStyles />
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{ duration: 4000 }}
            theme={isDark ? 'dark' : 'light'}
            richColors
          />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </GoogleOAuthProvider>
  )
}
