import { ThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/global'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeContextProvider, useThemeMode } from './contexts/ThemeContext'
import AppRoutes from './routes'
import { env } from './config/env'

const GOOGLE_CLIENT_ID = env.googleClientId || 'not-configured'

function ThemedApp() {
  const { isDark } = useThemeMode()
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <AuthProvider>
        <GlobalStyles />
        <AppRoutes />
      </AuthProvider>
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
