/**
 * Helper de render com os providers da aplicação.
 *
 * Componente que usa tema, rota ou sessão não renderiza sozinho: `render()`
 * puro estoura em "Cannot read properties of undefined (reading 'radii')" ou
 * "useNavigate() may be used only in the context of a <Router>". Este helper
 * monta a mesma pilha do `App.tsx` em volta do que você passar.
 *
 * Use SEMPRE ele no lugar do `render` da Testing Library — inclusive quando o
 * componente parece não precisar de nada. Custa o mesmo e sobrevive ao dia em
 * que ele passar a precisar.
 */
import type { ReactElement, ReactNode } from 'react'
import { render, renderHook as renderHookRTL } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lightTheme, darkTheme } from '../styles/theme'
import { ThemeContextProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Rota inicial do MemoryRouter. Ex.: `/pelada/42`. Padrão: `/`. */
  route?: string
  /**
   * Padrão da rota, quando o componente lê parâmetro da URL com `useParams`.
   *
   * Só `route` não basta: o React Router extrai `:eventId` do casamento entre
   * caminho e padrão, então sem `path` o `useParams()` devolve `{}` e o
   * componente quebra numa falha que não parece ter nada a ver com rota.
   *
   *   renderWithProviders(<PeladaDetail />, {
   *     route: '/pelada/42',
   *     path:  '/pelada/:eventId',
   *   })
   */
  path?: string
  /** Tema aplicado ao styled-components. Padrão: `light`. */
  theme?: 'light' | 'dark'
  /**
   * Cliente de query próprio, para o teste que precisa de `staleTime` real.
   *
   * O padrão usa `staleTime: 0`, que faz toda montagem revalidar — bom para o
   * teste comum, mas esconde exatamente o que a #198 entrega. Passe um cliente
   * com `staleTime` maior quando o que está sob teste for o cache em si.
   */
  queryClient?: QueryClient
}

export interface RenderWithProvidersResult extends RenderResult {
  /**
   * Instância do user-event já configurada. Prefira `await user.click(...)`
   * a `fireEvent`: ela dispara a sequência real de eventos do navegador
   * (pointerdown, focus, mousedown, click) e envolve tudo em `act`.
   */
  user: UserEvent
}

/**
 * Monta a pilha de providers do `App.tsx`.
 *
 * A ordem espelha o App: ThemeContextProvider por fora (é ele quem decide
 * claro/escuro) e o ThemeProvider do styled-components por dentro. Aqui o tema
 * é passado direto para o teste poder fixá-lo sem depender do localStorage nem
 * do matchMedia.
 */
function criarProviders({ route = '/', path, theme = 'light', queryClient: clienteDoTeste }: RenderWithProvidersOptions) {
  // Cliente novo a cada montagem: cache de query é global por natureza, e
  // reaproveitá-lo entre testes faria um teste ver o dado que o anterior
  // buscou — acoplamento que só aparece quando a ordem dos testes muda.
  // `retry: false` para o teste de erro falhar na hora, sem esperar retentativa;
  // `staleTime: 0` para o teste enxergar cada refetch que o componente pedir.
  const queryClient = clienteDoTeste ?? new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId="test-client-id">
          <ThemeContextProvider>
            <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
              <MemoryRouter initialEntries={[route]}>
                <AuthProvider>
                  {path
                    ? <Routes><Route path={path} element={children} /></Routes>
                    : children}
                </AuthProvider>
              </MemoryRouter>
            </ThemeProvider>
          </ThemeContextProvider>
        </GoogleOAuthProvider>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  { route, path, theme, queryClient, ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: criarProviders({ route, path, theme, queryClient }), ...options }),
  }
}

/**
 * `renderHook` com os mesmos providers — sombreia o da Testing Library.
 *
 * O reexport `export *` no fim do arquivo não sobrescreve nome declarado aqui,
 * então todo teste que já importava `renderHook` deste módulo passou a receber
 * esta versão sem precisar mudar uma linha. Necessário desde a #198: hook que
 * usa `useQuery` estoura com "No QueryClient set" fora do provider.
 */
export function renderHook<Resultado, Props>(
  callback: (props: Props) => Resultado,
  { route, path, theme, queryClient, ...options }: RenderWithProvidersOptions & { initialProps?: Props } = {},
) {
  return renderHookRTL(callback, { wrapper: criarProviders({ route, path, theme, queryClient }), ...options })
}

// Reexporta a Testing Library para o teste ter um import só:
//   import { renderWithProviders, screen, waitFor } from '../../test/render'
//
// O `render` cru vem junto no reexport. Ele existe para o caso raro de você
// precisar montar um componente fora dos providers de propósito — no dia a dia,
// use `renderWithProviders`.
export * from '@testing-library/react'
