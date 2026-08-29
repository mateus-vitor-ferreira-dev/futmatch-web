/**
 * Amigos, no menu e com as abas do Instagram (web#375, api#387).
 *
 * O teste que carrega o arquivo é o do **item no menu lateral**. A tela nasceu
 * como aba dentro de `/perfil`, e a primeira pessoa que foi olhar as telas
 * novas não a encontrou: o caminho existia e ninguém adivinharia. Perfil é onde
 * se configura a conta; amigos é onde se usa o produto.
 *
 * O segundo é o da **ordem das abas**. Seguidores antes de Seguindo é a ordem
 * do perfil do Instagram, e inverter obriga a conferir qual é qual toda vez —
 * o par é fácil de trocar sem ninguém notar na revisão.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { followsService } from '../../services/follows'
import { arvoreDeRotas } from '../../routes/arvore'
import MainLayout from '../../components/MainLayout'
import Amigos from './index'

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

describe('Amigos', () => {
  it('está no menu lateral do jogador — foi por não estar que ninguém a achou', () => {
    renderWithProviders(<MainLayout />, { route: '/home' })

    const item = screen.getByRole('link', { name: /^amigos$/i })
    expect(item).toHaveAttribute('href', '/amigos')
  })

  it('não repete o ícone de Meus Times', () => {
    renderWithProviders(<MainLayout />, { route: '/home' })

    // Os dois eram silhuetas de duas pessoas — `Users` e `UsersRound` —, e no
    // tamanho do menu ninguém os distinguia. O `lucide` carimba a classe.
    const times = screen.getByRole('link', { name: /meus times/i }).querySelector('svg')
    const amigos = screen.getByRole('link', { name: /^amigos$/i }).querySelector('svg')

    expect(times?.getAttribute('class')).not.toBe(amigos?.getAttribute('class'))
  })

  it('tem rota própria em /amigos', () => {
    // O `arvoreDeRotas` é a fonte de verdade sobre o que o app registra —
    // é o mesmo que o `numeros-do-readme` percorre.
    const marcacao = JSON.stringify(arvoreDeRotas)
    expect(marcacao).toContain('/amigos')
  })

  it('abre nas três listas, com os amigos primeiro', async () => {
    renderWithProviders(<Amigos />)

    expect(await screen.findByRole('heading', { name: 'Amigos' })).toBeInTheDocument()

    const abas = await screen.findAllByRole('tab')
    // Seguidores antes de Seguindo, como no perfil do Instagram. Amigos
    // primeiro porque é a única das três que só existe aqui.
    expect(abas.map((a) => a.textContent)).toEqual([
      '0 amigos',
      '0 seguidores',
      '0 seguindo',
    ])
    // Amigos é a primeira porque é a lista que só existe aqui: seguidores e
    // seguindo de qualquer pessoa também aparecem na página dela.
    expect(abas[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('explica que amizade não tem convite, na aba em que isso importa', async () => {
    renderWithProviders(<Amigos />)

    expect(await screen.findByText(/Ninguém aceita nada/)).toBeInTheDocument()
  })
})
