/**
 * A página de outra pessoa (web#375, api#387).
 *
 * O teste que carrega o arquivo é o de que **os amigos não aparecem aqui**. A
 * api só responde os mútuos de quem está logado, e é decisão dela: a amizade de
 * terceiros seria uma interseção que nenhum dos dois lados pediu para publicar.
 * Cruzar seguidores com seguindo no cliente e exibir a interseção assim mesmo
 * seria contornar isso por fora — e é a coisa mais natural de alguém escrever
 * ao olhar as duas listas juntas na tela.
 *
 * O segundo é o do vazio nominal. "Nenhum resultado" numa lista de gente não
 * diz de quem é a lista, e as duas abas dizem coisas opostas: ninguém segue
 * esta pessoa, ou esta pessoa não segue ninguém.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { followsService } from '../../services/follows'
import { perfilPublico } from '../../services/users'
import Jogador from './index'
import type { PerfilPublico, PessoaDaRede } from '../../types/api'

vi.mock('../../services/follows')
vi.mock('../../services/users')

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu' } } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const buscaPerfil = vi.mocked(perfilPublico)
const servico = vi.mocked(followsService)

const pessoa = (id: string, name: string): PessoaDaRede => ({
  id, name, nickname: null, avatarUrl: null, badge: null, desde: '2026-08-01T00:00:00.000Z',
})

function perfil(over: Partial<PerfilPublico> = {}): PerfilPublico {
  return {
    id: 'ana',
    name: 'Ana Ribeiro',
    nickname: null,
    avatarUrl: null,
    badge: 'CRAQUE',
    role: 'PLAYER',
    createdAt: '2026-01-10T00:00:00.000Z',
    stats: { averageStars: 4.6, totalReviews: 9, totalPartidas: 21, tags: [] },
    ...over,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const respondePerfil = (p: PerfilPublico) => buscaPerfil.mockResolvedValue({ data: { success: true, data: p } } as any)

const monta = () =>
  renderWithProviders(<Jogador />, { route: '/jogador/ana', path: '/jogador/:userId' })

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { id: 'eu' } }
  respondePerfil(perfil())
  servico.seguidores.mockResolvedValue([])
  servico.seguindo.mockResolvedValue([])
  servico.meusAmigos.mockResolvedValue([])
})

describe('Jogador', () => {
  it('mostra nome, reputação e o botão de seguir', async () => {
    monta()

    expect(await screen.findByRole('heading', { name: 'Ana Ribeiro' })).toBeInTheDocument()
    expect(screen.getByText(/4\.6/)).toBeInTheDocument()
    expect(screen.getByText(/21 partidas/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Seguir Ana Ribeiro' })).toBeInTheDocument()
  })

  it('nota nula é ausência, e não zero', async () => {
    respondePerfil(perfil({ stats: { averageStars: null, totalReviews: 0, totalPartidas: 0, tags: [] } }))

    monta()

    // "⭐ 0,0" leria como jogador ruim; quem chegou agora não é jogador ruim.
    expect(await screen.findByText(/Sem avaliações ainda/)).toBeInTheDocument()
    expect(screen.queryByText(/0\.0/)).not.toBeInTheDocument()
  })

  it('não mostra os amigos desta pessoa — a api não os publica', async () => {
    // As duas listas se cruzam na Bia: seria a interseção que a tela NÃO faz.
    servico.seguidores.mockResolvedValue([pessoa('bia', 'Bia')])
    servico.seguindo.mockResolvedValue([pessoa('bia', 'Bia')])

    monta()

    await screen.findByRole('heading', { name: 'Ana Ribeiro' })

    expect(screen.queryByRole('tab', { name: /amigos/i })).not.toBeInTheDocument()
    // E nada de pedir os amigos de terceiro: a rota só existe para "eu", e é
    // chamada pelo botão de seguir — nunca com o id desta pessoa.
    expect(servico.meusAmigos).not.toHaveBeenCalledWith('ana')
  })

  it('as duas abas dizem coisas opostas quando vazias', async () => {
    const { user } = monta()

    expect(await screen.findByText('Ninguém segue Ana Ribeiro ainda.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /seguindo/i }))

    expect(await screen.findByText('Ana Ribeiro ainda não segue ninguém.')).toBeInTheDocument()
  })

  it('a lista leva ao perfil de cada pessoa', async () => {
    servico.seguidores.mockResolvedValue([pessoa('bia', 'Bia')])

    monta()

    const link = await screen.findByRole('link', { name: 'Bia' })
    expect(link).toHaveAttribute('href', '/jogador/bia')
  })

  it('perfil que não carrega avisa, em vez de mostrar uma pessoa vazia', async () => {
    buscaPerfil.mockRejectedValue(new Error('500'))

    monta()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar este perfil.'),
    )
  })
})
