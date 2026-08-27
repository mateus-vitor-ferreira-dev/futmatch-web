import { ThemeProvider } from 'styled-components'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/global'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeContextProvider, useThemeMode } from './contexts/ThemeContext'
import AppRoutes from './routes'
import ErrorBoundary from './components/ErrorBoundary'

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
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </QueryClientProvider>
  )
}
