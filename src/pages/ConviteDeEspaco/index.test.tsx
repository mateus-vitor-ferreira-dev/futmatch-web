/**
 * Entrar num espaço por um link (web#410, api#509).
 *
 * O que estes testes carregam é o que separa esta tela da vizinha, do convite
 * por e-mail — e cada diferença vem de os dois serem objetos diferentes:
 *
 * 1. **Os três motivos de recusa dizem coisas diferentes.** A vizinha junta
 *    vencido e inexistente de propósito, porque a api responde 404 para os dois.
 *    Aqui a api **separa**, porque o que a pessoa faz em seguida é diferente:
 *    venceu → peça outro; esgotou → o limite acabou; revogado → fecharam a
 *    porta. Juntar jogaria fora informação que a api mandou de propósito.
 * 2. **200 e 201 não dizem a mesma coisa.** Recarregar a página não cria nada e
 *    não gasta uso; dizer "pronto!" nos dois casos faria a pessoa achar que
 *    entrou duas vezes, e o dono veria o contador não bater com a lista.
 * 3. **Funciona deslogada**, e sem pedir um e-mail que não existe: aqui não há
 *    destinatário, e repetir a frase da tela vizinha mandaria a pessoa procurar
 *    um convite que nunca foi endereçado a ela.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { professoresService } from '../../services/professores'
import ConviteDeEspaco from './index'

vi.mock('../../services/professores')

const auth = vi.hoisted(() => ({
  estado: {
    user: { id: 'eu', email: 'ana@player.com' },
    isAuthenticated: true,
    loading: false,
    refreshUser: vi.fn(),
  },
}))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const servico = vi.mocked(professoresService)

function erro(status: number, code: string): AxiosError {
  const e = new AxiosError('erro')
  e.response = {
    status, data: { success: false, message: 'erro', code },
    statusText: '', headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() },
  }
  return e
}

const LINK = {
  place: { id: 'ltc', name: 'Lavras Tênis Clube' },
  papel: 'PROFESSOR' as const,
  expiresAt: '2026-09-11T00:00:00.000Z',
}

const monta = (token = 'tk-1') =>
  renderWithProviders(<ConviteDeEspaco />, {
    route: `/convite-espaco?link=${token}`,
    path: '/convite-espaco',
  })

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = {
    user: { id: 'eu', email: 'ana@player.com' },
    isAuthenticated: true,
    loading: false,
    refreshUser: vi.fn(),
  }
  servico.verificarLink.mockResolvedValue(LINK)
  servico.entrarPeloLink.mockResolvedValue({
    member: { id: 'v1', papel: 'PROFESSOR', place: LINK.place },
    novo: true,
  })
})

describe('ConviteDeEspaco', () => {
  it('mostra de que espaço é o link, e entra', async () => {
    const { user } = monta()

    expect(await screen.findByText('Lavras Tênis Clube')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /entrar como professor/i }))

    await waitFor(() => expect(servico.entrarPeloLink).toHaveBeenCalledWith('tk-1'))
    expect(await screen.findByText('Pronto!')).toBeInTheDocument()
    expect(screen.getByText(/agora é professor em Lavras Tênis Clube/i)).toBeInTheDocument()
    // O vínculo novo entra no /auth/me, e é de lá que a sidebar lê "professor em".
    expect(auth.estado.refreshUser).toHaveBeenCalled()
  })

  it('entrar de novo não diz "pronto" — diz que já estava, e que nada foi gasto', async () => {
    servico.entrarPeloLink.mockResolvedValue({
      member: { id: 'v1', papel: 'PROFESSOR', place: LINK.place },
      novo: false,
    })
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /entrar como professor/i }))

    expect(await screen.findByText('Você já estava aqui')).toBeInTheDocument()
    expect(screen.getByText(/este link não foi gasto/i)).toBeInTheDocument()
    // Nada nasceu: recarregar o `/auth/me` seria uma volta à api por nada.
    expect(auth.estado.refreshUser).not.toHaveBeenCalled()
  })

  it('não oferece recusar — não há o que recusar num link', async () => {
    monta()

    await screen.findByText('Lavras Tênis Clube')
    // A tela vizinha tem "Recusar" porque lá alguém perguntou. Aqui ninguém
    // perguntou nada: quem não quer, fecha a aba.
    expect(screen.queryByRole('button', { name: /recusar/i })).not.toBeInTheDocument()
  })

  it.each([
    ['PLACE_INVITE_LINK_EXPIRED', 'Este link venceu', /peça um link novo/i],
    ['PLACE_INVITE_LINK_EXHAUSTED', 'Este link já foi usado', /esse limite acabou/i],
    ['PLACE_INVITE_LINK_REVOKED', 'Este link foi desativado', /desativou/i],
  ])('%s diz o que fazer em seguida, e não um erro genérico', async (code, titulo, texto) => {
    servico.verificarLink.mockRejectedValue(erro(403, code))

    monta()

    expect(await screen.findByText(titulo)).toBeInTheDocument()
    expect(screen.getByText(texto)).toBeInTheDocument()
  })

  it('funciona deslogada, e volta para cá depois do login', async () => {
    auth.estado = { ...auth.estado, user: null, isAuthenticated: false } as never
    monta()

    // O `verify` é público justamente para quem ainda não tem conta ver de que
    // espaço é antes de decidir se vale se cadastrar.
    expect(await screen.findByText('Lavras Tênis Clube')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href', expect.stringContaining('next=%2Fconvite-espaco%3Flink%3Dtk-1'),
    )
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeInTheDocument()
    // E não pede "o e-mail que recebeu o convite": aqui não há destinatário.
    expect(screen.queryByText(/e-mail que recebeu/i)).not.toBeInTheDocument()
  })

  it('link sem token na URL diz que o endereço veio pela metade', async () => {
    renderWithProviders(<ConviteDeEspaco />, { route: '/convite-espaco', path: '/convite-espaco' })

    expect(await screen.findByText('Link incompleto')).toBeInTheDocument()
    expect(servico.verificarLink).not.toHaveBeenCalled()
  })
})
