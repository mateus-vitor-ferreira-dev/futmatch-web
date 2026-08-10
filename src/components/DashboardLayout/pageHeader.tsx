import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PageHeaderContextValue {
  /** Publica título e subtítulo na topbar. Estável entre renders. */
  setHeader: (title: string, sub?: string) => void
  /** Publica o contador de um item do menu lateral. Estável entre renders. */
  setNavBadge: (to: string, count: number) => void
  /** Nó da topbar onde `<PageActions>` injeta o conteúdo da página. */
  actionsSlot: HTMLElement | null
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export const PageHeaderProvider = PageHeaderContext.Provider

/**
 * Publica o título da página na topbar do layout.
 *
 * Antes da #197 o título vinha por prop (`pageTitle`), o que obrigava cada
 * página a renderizar o layout inteiro dentro de si — e a remontá-lo a cada
 * navegação. Agora o layout é rota-pai e a página só publica o texto.
 *
 * Aceita apenas strings de propósito: elas são as dependências do efeito, e
 * string tem identidade estável entre renders. Passar um ReactNode aqui
 * refaria o efeito a cada render e entraria em loop com o setState do
 * layout. Ação interativa vai por `<PageActions>`, que usa portal e não
 * depende de efeito.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePageHeader(title: string, sub?: string) {
  const ctx = useContext(PageHeaderContext)
  const setHeader = ctx?.setHeader

  useEffect(() => {
    setHeader?.(title, sub)
  }, [setHeader, title, sub])
}

/**
 * Publica o contador de um item do menu lateral.
 *
 * Mantém o comportamento que existia antes da #197: só a página de
 * solicitações do admin conhece a contagem de pendentes, e o badge some ao
 * sair dela. Levar a contagem para o layout faria o número valer em todas as
 * telas, mas custaria uma chamada de API na montagem do painel — mudança de
 * comportamento que não pertence a esta issue.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useNavBadge(to: string, count: number) {
  const ctx = useContext(PageHeaderContext)
  const setNavBadge = ctx?.setNavBadge

  useEffect(() => {
    setNavBadge?.(to, count)
  }, [setNavBadge, to, count])
}

/**
 * Renderiza ações no canto direito da topbar, ao lado do sino.
 *
 * Portal em vez de estado: o conteúdo é JSX com handlers que mudam de
 * identidade a cada render da página, e guardá-lo em estado do layout
 * criaria um ciclo render → setState → render.
 */
export function PageActions({ children }: { children: ReactNode }) {
  const ctx = useContext(PageHeaderContext)
  // Na primeira passada o slot ainda não existe: o ref do layout só resolve
  // depois da montagem. O re-render que o `useState` do slot dispara traz o
  // conteúdo no ciclo seguinte.
  if (!ctx?.actionsSlot) return null
  return createPortal(children, ctx.actionsSlot)
}
