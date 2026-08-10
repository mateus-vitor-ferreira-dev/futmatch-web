import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { Inbox } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../test/render'
import DashboardLayout from './DashboardLayout'
import MainLayout from './MainLayout'
import { PageActions, useNavBadge, usePageHeader } from './DashboardLayout/pageHeader'

/**
 * Regressão da #197.
 *
 * O layout ficava dentro de cada página, então trocar de rota o desmontava e
 * remontava: sidebar sumia e voltava, e tudo que ele monta — inclusive a
 * conexão SSE do sino — era refeito. Medido em produção, isso disparava
 * `GET /notifications` e `GET /sports` em toda navegação.
 *
 * O contador abaixo é o detector: ele conta montagens do layout. Se alguém
 * voltar a aninhar o layout dentro das páginas, ele passa de 1 e o teste cai.
 */
const montagens = vi.fn()

function SondaDeMontagem() {
  useEffect(() => {
    montagens()
  }, [])
  return null
}

function PaginaJogador({ nome }: { nome: string }) {
  return (
    <div>
      <h2>{nome}</h2>
      <Link to="/outra">ir para Outra</Link>
      <Link to="/home">ir para Home</Link>
    </div>
  )
}

function PaginaPainel({ titulo }: { titulo: string }) {
  usePageHeader(titulo, `sub de ${titulo}`)
  return <Link to="/painel/segunda">ir para Segunda</Link>
}

beforeEach(() => {
  montagens.mockClear()
})

describe('layout como rota-pai', () => {
  it('não remonta o MainLayout ao navegar entre páginas do jogador', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route
          element={
            <>
              <SondaDeMontagem />
              <MainLayout />
            </>
          }
        >
          <Route path="/home"  element={<PaginaJogador nome="Home" />} />
          <Route path="/outra" element={<PaginaJogador nome="Outra" />} />
        </Route>
      </Routes>,
      { route: '/home' },
    )

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('link', { name: 'ir para Outra' }))
    expect(await screen.findByRole('heading', { name: 'Outra' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'ir para Home' }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()

    // Duas navegações depois, o layout continua sendo a mesma instância.
    expect(montagens).toHaveBeenCalledTimes(1)
  })

  it('não remonta o DashboardLayout e troca o título ao navegar', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route
          path="/painel"
          element={
            <>
              <SondaDeMontagem />
              <DashboardLayout navItems={[]} tagline="Painel" accent="#3baa34" />
            </>
          }
        >
          <Route index            element={<PaginaPainel titulo="Primeira" />} />
          <Route path="segunda"   element={<PaginaPainel titulo="Segunda"  />} />
        </Route>
      </Routes>,
      { route: '/painel' },
    )

    expect(await screen.findByText('Primeira')).toBeInTheDocument()
    expect(screen.getByText('sub de Primeira')).toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('link', { name: 'ir para Segunda' }))

    expect(await screen.findByText('Segunda')).toBeInTheDocument()
    expect(screen.queryByText('Primeira')).not.toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)
  })
})

describe('publicação da página na topbar', () => {
  it('renderiza as ações da página dentro da topbar do layout', async () => {
    function ComAcoes() {
      usePageHeader('Com ações')
      return (
        <>
          <PageActions><button type="button">Nova Quadra</button></PageActions>
          <p>corpo</p>
        </>
      )
    }

    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout navItems={[]} tagline="Painel" accent="#3baa34" />}>
          <Route index element={<ComAcoes />} />
        </Route>
      </Routes>,
    )

    const botao = await screen.findByRole('button', { name: 'Nova Quadra' })
    // O portal precisa cair na topbar, ao lado do sino — não no corpo da página.
    expect(botao.closest('header')).not.toBeNull()
  })

  it('mostra no menu o contador publicado pela página', async () => {
    const itens = [{ to: '/painel/pedidos', label: 'Pedidos', icon: Inbox }]

    function ComBadge() {
      usePageHeader('Pedidos')
      useNavBadge('/painel/pedidos', 7)
      return <p>corpo</p>
    }

    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout navItems={itens} tagline="Painel" accent="#3baa34" />}>
          <Route index element={<ComBadge />} />
        </Route>
      </Routes>,
    )

    expect(await screen.findByText('7')).toBeInTheDocument()
  })
})
