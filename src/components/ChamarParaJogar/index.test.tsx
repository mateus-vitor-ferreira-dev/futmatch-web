/**
 * "Chamar para jogar", a partir da lista de amigos (#380).
 *
 * A lista mostrava seis amigos e a única ação em cada linha era **perder um**
 * — "Seguindo", cujo toque desfaz o vínculo. Estes testes cobrem o caminho que
 * faltava, e as duas bordas que decidem se ele é honesto:
 *
 * 1. **Só as partidas que eu organizo entram.** O `inviteRouter` da api é
 *    guardado por `isOrganizerOrAdmin`; oferecer uma partida em que eu só
 *    participo levaria a um 403 depois da escolha.
 * 2. **Sem partida, o caminho é criar** — e não um vazio.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaPartida, envelope } from '../../test/factories'
import type { PessoaDaRede } from '../../types/api'

const { navegar } = vi.hoisted(() => ({ navegar: vi.fn() }))
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => navegar,
}))
vi.mock('../../services/playerService')
vi.mock('../../services/invites')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

import { playerService } from '../../services/playerService'
import * as invites from '../../services/invites'
import { ListaDePessoas } from '../ListaDePessoas'

const buscaCriadas = vi.mocked(playerService.getMyCreatedEvents)

const amiga: PessoaDaRede = {
  id: 'amiga-1',
  name: 'Bia',
  avatarUrl: null,
  badge: null,
  desde: '2026-01-01T00:00:00.000Z',
}

const lista = () => (
  <ListaDePessoas pessoas={[amiga]} carregando={false} erro={false} vazio="vazio" />
)

beforeEach(() => {
  vi.clearAllMocks()
  buscaCriadas.mockResolvedValue(envelope([]))
  vi.mocked(invites.listarConvites).mockResolvedValue(envelope([]))
  vi.mocked(invites.criarConvite).mockResolvedValue(
    envelope({
      id: 'convite-1',
      url: 'https://so-mais-um.com/convite/abc',
      token: 'abc',
      uses: 0,
      maxUses: null,
      remainingUses: null,
      expiresAt: null,
      revokedAt: null,
    }) as never,
  )
})

describe('ChamarParaJogar (#380)', () => {
  it('cada linha da lista oferece chamar a pessoa para jogar', () => {
    renderWithProviders(lista())

    expect(screen.getByRole('button', { name: 'Chamar Bia para jogar' })).toBeInTheDocument()
  })

  it('o modal lista as minhas partidas futuras com vaga, com o nome de quem estou chamando', async () => {
    buscaCriadas.mockResolvedValue(
      envelope([criaPartida({ id: 'p-1', maxPlayers: 10, _count: { participations: 4 } })]),
    )

    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))

    const modal = within(await screen.findByRole('dialog', { name: 'Chamar Bia para jogar' }))
    expect(await modal.findByText('Arena Sul')).toBeInTheDocument()
    expect(modal.getByText(/4\/10 confirmados/)).toBeInTheDocument()
  })

  it('partida lotada ou passada não é oferecida', async () => {
    buscaCriadas.mockResolvedValue(
      envelope([
        criaPartida({ id: 'cheia', maxPlayers: 10, _count: { participations: 10 } }),
        criaPartida({
          id: 'passada',
          date: '2020-01-01T10:00:00.000Z',
          endsAt: '2020-01-01T11:00:00.000Z',
          _count: { participations: 1 },
        }),
      ]),
    )

    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))

    // Nenhuma das duas serve, então cai no caminho de criar.
    expect(await screen.findByText(/não tem nenhuma partida futura com vaga/i)).toBeInTheDocument()
  })

  /**
   * Sem partida, o caminho é **criar** — quem tocou "chamar para jogar" já
   * decidiu que quer jogar com essa pessoa; faltar partida é um passo a dar,
   * não um beco.
   */
  it('sem partida com vaga, leva para criar uma', async () => {
    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))

    await user.click(await screen.findByRole('button', { name: 'Criar Partida' }))

    expect(navegar).toHaveBeenCalledWith('/criar-partida')
  })

  /**
   * Escolhida a partida, quem assume é o `CompartilharPartida` que já existe —
   * e não um segundo lugar que gera link.
   */
  it('escolher a partida entrega o link do CompartilharPartida', async () => {
    buscaCriadas.mockResolvedValue(
      envelope([criaPartida({ id: 'p-1', _count: { participations: 4 } })]),
    )

    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))
    await user.click(await screen.findByRole('button', { name: /Arena Sul/ }))

    await waitFor(() => expect(invites.criarConvite).toHaveBeenCalledWith('quadra-1', 'p-1'))
    expect(await screen.findByTestId('link-do-convite')).toHaveTextContent(
      'https://so-mais-um.com/convite/abc',
    )
  })

  /**
   * A tela continua honesta sobre o que o link é: um endereço que qualquer um
   * que o receba pode usar, e não um convite pessoal que chegou para a Bia.
   */
  it('não promete que a pessoa recebeu um convite', async () => {
    buscaCriadas.mockResolvedValue(
      envelope([criaPartida({ id: 'p-1', _count: { participations: 4 } })]),
    )

    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))

    const modal = within(await screen.findByRole('dialog', { name: 'Chamar Bia para jogar' }))
    expect(modal.getByText(/você recebe um link para mandar/i)).toBeInTheDocument()
  })

  it('só busca as partidas que eu organizo — as que eu participo dariam 403 no link', async () => {
    const { user } = renderWithProviders(lista())
    await user.click(screen.getByRole('button', { name: 'Chamar Bia para jogar' }))

    await waitFor(() => expect(buscaCriadas).toHaveBeenCalled())
    expect(playerService.getMyParticipatingEvents).not.toHaveBeenCalled()
  })
})
