import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../test/render'
import DashboardLayout from './DashboardLayout'
import MainLayout from './MainLayout'

describe('seletor de tema dos layouts', () => {
  it('alterna o tema no painel administrativo', async () => {
    const { user } = renderWithProviders(
      <DashboardLayout
        navItems={[]}
        tagline="Painel"
        accent="#3baa34"
        pageTitle="Visão geral"
      >
        <p>Conteúdo</p>
      </DashboardLayout>,
    )

    await user.click(screen.getByRole('button', { name: 'Modo escuro' }))

    expect(screen.getByRole('button', { name: 'Modo claro' })).toBeInTheDocument()
    expect(localStorage.getItem('só+1:theme')).toBe('dark')
  })

  it('mantém os seletores desktop e mobile sincronizados no layout principal', async () => {
    const { user } = renderWithProviders(
      <MainLayout>
        <p>Conteúdo</p>
      </MainLayout>,
    )

    const [desktopToggle] = screen.getAllByRole('button', { name: 'Modo escuro' })
    await user.click(desktopToggle)

    expect(screen.getAllByTitle('Modo claro')).toHaveLength(2)
    expect(localStorage.getItem('só+1:theme')).toBe('dark')
  })
})
