/**
 * A rede como página, e no menu (web#375, api#387).
 *
 * O teste que carrega o arquivo é o do **item no menu lateral**. A rede nasceu
 * como aba dentro de `/perfil`, e a primeira pessoa que foi olhar as telas
 * novas não a encontrou: o caminho existia e ninguém adivinharia. Perfil é onde
 * se configura a conta; rede é onde se usa o produto.
 *
 * O teste olha o `NAV_ITEMS` do layout porque é ele que decide o que aparece —
 * afirmar sobre a página montada não pegaria o dia em que o item sumisse do
 * menu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { followsService } from '../../services/follows'
import { arvoreDeRotas } from '../../routes/arvore'
import MainLayout from '../../components/MainLayout'
import Rede from './index'

vi.mock('../../services/follows')

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu' } } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const servico = vi.mocked(followsService)

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { id: 'eu' } }
  servico.meusAmigos.mockResolvedValue([])
  servico.seguindo.mockResolvedValue([])
  servico.seguidores.mockResolvedValue([])
})

describe('Rede', () => {
  it('está no menu lateral do jogador — foi por não estar que ninguém a achou', () => {
    renderWithProviders(<MainLayout />, { route: '/home' })

    const item = screen.getByRole('link', { name: /minha rede/i })
    expect(item).toHaveAttribute('href', '/rede')
  })

  it('tem rota própria em /rede', () => {
    // O `arvoreDeRotas` é a fonte de verdade sobre o que o app registra —
    // é o mesmo que o `numeros-do-readme` percorre.
    const marcacao = JSON.stringify(arvoreDeRotas)
    expect(marcacao).toContain('/rede')
  })

  it('abre nas três listas, com os amigos primeiro', async () => {
    renderWithProviders(<Rede />)

    expect(await screen.findByRole('heading', { name: 'Minha Rede' })).toBeInTheDocument()

    const abas = await screen.findAllByRole('tab')
    expect(abas.map((a) => a.textContent)).toEqual([
      '0 amigos',
      '0 seguindo',
      '0 seguidores',
    ])
    // Amigos é a primeira porque é a lista que só existe aqui: seguidores e
    // seguindo de qualquer pessoa também aparecem na página dela.
    expect(abas[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('explica que amizade não tem convite, na aba em que isso importa', async () => {
    renderWithProviders(<Rede />)

    expect(await screen.findByText(/Ninguém aceita nada/)).toBeInTheDocument()
  })
})
