/**
 * O botão de seguir (web#375, api#387).
 *
 * O teste que carrega o arquivo é o de **não aparecer para si mesmo**. A api
 * recusa seguir a própria conta com 422, e um botão que só existe para produzir
 * erro é pior do que botão nenhum: quem toca conclui que o app quebrou. É o
 * mesmo raciocínio da web#250 — não abrir o caminho que termina em recusa.
 *
 * O segundo é o do selo de amizade separado do rótulo. Amigo é sempre alguém
 * que eu sigo, e juntar os dois num rótulo "Amigos" esconderia que existe um
 * follow meu ali para desfazer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { followsService } from '../../services/follows'
import { BotaoSeguir } from './index'
import type { PessoaDaRede } from '../../types/api'

vi.mock('../../services/follows')

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu' } } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const servico = vi.mocked(followsService)

const pessoa = (id: string, name: string): PessoaDaRede => ({
  id, name, nickname: null, avatarUrl: null, badge: null, desde: '2026-08-01T00:00:00.000Z',
})

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { id: 'eu' } }
  servico.seguindo.mockResolvedValue([])
  servico.meusAmigos.mockResolvedValue([])
  servico.seguir.mockResolvedValue({ id: 'follow-1' })
  servico.deixarDeSeguir.mockResolvedValue({ desfeito: true })
})

describe('BotaoSeguir', () => {
  it('não aparece no próprio perfil', () => {
    renderWithProviders(<BotaoSeguir userId="eu" nome="Eu Mesmo" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('não aparece para quem não tem sessão', () => {
    auth.estado = { user: null } as unknown as typeof auth.estado

    renderWithProviders(<BotaoSeguir userId="ana" nome="Ana" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('segue quem ainda não é seguido', async () => {
    const { user } = renderWithProviders(<BotaoSeguir userId="ana" nome="Ana" />)

    const botao = await screen.findByRole('button', { name: 'Seguir Ana' })
    await waitFor(() => expect(botao).toBeEnabled())
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    await user.click(botao)

    await waitFor(() => expect(servico.seguir).toHaveBeenCalledWith('ana'))
  })

  it('deixa de seguir sem pedir confirmação — a ação é reversível com um toque', async () => {
    servico.seguindo.mockResolvedValue([pessoa('ana', 'Ana')])

    const { user } = renderWithProviders(<BotaoSeguir userId="ana" nome="Ana" />)

    const botao = await screen.findByRole('button', { name: 'Deixar de seguir Ana' })
    await waitFor(() => expect(botao).toBeEnabled())
    expect(botao).toHaveAttribute('aria-pressed', 'true')

    await user.click(botao)

    // Nenhum diálogo entre o toque e a chamada.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(servico.deixarDeSeguir).toHaveBeenCalledWith('ana'))
  })

  it('mostra o selo de amizade ao lado, e o botão continua dizendo "Seguindo"', async () => {
    servico.seguindo.mockResolvedValue([pessoa('ana', 'Ana')])
    servico.meusAmigos.mockResolvedValue([pessoa('ana', 'Ana')])

    renderWithProviders(<BotaoSeguir userId="ana" nome="Ana" />)

    expect(await screen.findByText('Amigos')).toBeInTheDocument()
    // O follow que dá para desfazer continua visível: o selo não o substitui.
    expect(screen.getByRole('button', { name: 'Deixar de seguir Ana' })).toBeInTheDocument()
  })
})
