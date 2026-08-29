/**
 * Seguir quem jogou com você, no fim da partida (web#375, api#387).
 *
 * O teste que carrega o arquivo é o de que o botão **apareça na avaliação**.
 * Este modal é a única tela do produto que enumera com quem você acabou de
 * jogar, e era o momento em que dava para saber quem seguir — o jogo acabou
 * agora e o nome está na frente da pessoa. Sem ele, o caminho até alguém que
 * jogou com você é achar a partida, abrir a lista de participantes e clicar no
 * nome. Ninguém faz isso.
 *
 * O segundo é o de que **seguir não entre na avaliação**. Nota, tag e
 * comentário vão juntos num envio só, ao fim do modal; seguir grava na hora e
 * não tem nada a ver com a nota. Misturar os dois faria "não avaliei ainda"
 * cancelar um follow que a pessoa já deu — e quem segue não está avaliando
 * melhor.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { playerService } from '../../services/playerService'
import { followsService } from '../../services/follows'
import Historico from './index'

vi.mock('../../services/playerService')
vi.mock('../../services/follows')

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu', name: 'Eu' } } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const jogador = vi.mocked(playerService)
const rede = vi.mocked(followsService)

const PARTIDA = {
  id: 'p1',
  courtId: 'q1',
  date: '2026-08-01T22:00:00.000Z',
  status: 'FINISHED',
  court: { name: 'Quadra 1', place: { name: 'Arena' } },
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { id: 'eu', name: 'Eu' } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jogador.getMyParticipatingEvents.mockResolvedValue({ data: [{ userId: 'eu', match: PARTIDA }] } as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jogador.getUserReviews.mockResolvedValue({ data: { summary: {} } } as any)
  jogador.getEventParticipants.mockResolvedValue({
    data: [
      { userId: 'eu',  user: { id: 'eu',  name: 'Eu' } },
      { userId: 'ana', user: { id: 'ana', name: 'Ana Ribeiro' } },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jogador.getReviewProgress.mockResolvedValue({ data: null } as any)

  rede.seguindo.mockResolvedValue([])
  rede.meusAmigos.mockResolvedValue([])
  rede.seguir.mockResolvedValue({ id: 'f1' })
})

describe('Histórico — seguir no fim da partida', () => {
  it('oferece seguir cada pessoa que jogou com você', async () => {
    const { user } = renderWithProviders(<Historico />)

    await user.click(await screen.findByRole('button', { name: /avaliar jogadores/i }))

    const seguir = await screen.findByRole('button', { name: 'Seguir Ana Ribeiro' })
    await waitFor(() => expect(seguir).toBeEnabled())

    await user.click(seguir)

    await waitFor(() => expect(rede.seguir).toHaveBeenCalledWith('ana'))
  })

  it('seguir grava na hora, sem esperar o envio da avaliação', async () => {
    const { user } = renderWithProviders(<Historico />)

    await user.click(await screen.findByRole('button', { name: /avaliar jogadores/i }))
    const seguir = await screen.findByRole('button', { name: 'Seguir Ana Ribeiro' })
    await waitFor(() => expect(seguir).toBeEnabled())
    await user.click(seguir)

    await waitFor(() => expect(rede.seguir).toHaveBeenCalled())
    // A avaliação continua onde estava: o follow não a envia junto, nem depende dela.
    expect(jogador.submitReview).not.toHaveBeenCalled()
  })

  it('não oferece seguir a si mesmo — a lista já exclui quem está logado', async () => {
    const { user } = renderWithProviders(<Historico />)

    await user.click(await screen.findByRole('button', { name: /avaliar jogadores/i }))
    await screen.findByRole('button', { name: 'Seguir Ana Ribeiro' })

    expect(screen.queryByRole('button', { name: 'Seguir Eu' })).not.toBeInTheDocument()
  })
})
