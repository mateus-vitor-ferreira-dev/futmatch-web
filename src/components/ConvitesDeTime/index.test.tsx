/**
 * Os convites de time do jogador (#218).
 *
 * O caso que a issue nomeia por extenso é o do convite vencido: ele **aparece
 * como expirado**, e não some. Some era o que acontecia — a pessoa recebia a
 * notificação, abria a tela e não achava nada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaConviteDeTime, criaJogadorDeTime, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import ConvitesDeTime from './index'

const { navegar } = vi.hoisted(() => ({ navegar: vi.fn() }))
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => navegar,
}))
vi.mock('../../services/teams')
vi.mock('../../services/auth')
vi.mock('../../services/notificationService')
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

import { teamsService } from '../../services/teams'
import * as authService from '../../services/auth'
import { notificationService } from '../../services/notificationService'
import { toast } from 'sonner'

const listar = vi.mocked(teamsService.meusConvites)
const aceitar = vi.mocked(teamsService.aceitarConvite)
const recusar = vi.mocked(teamsService.recusarConvite)

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id: 'user-1' })))
  vi.mocked(notificationService.list).mockResolvedValue([])
  listar.mockResolvedValue([])
})

describe('Convites de time', () => {
  it('não ocupa espaço quando não há convite', async () => {
    listar.mockResolvedValue([])

    const { container } = renderWithProviders(<ConvitesDeTime />)

    await waitFor(() => expect(listar).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('diz quem chamou e para qual time', async () => {
    listar.mockResolvedValue([
      criaConviteDeTime({
        invitedBy: criaJogadorDeTime({ id: 'c1', name: 'Alex Souza' }),
      }),
    ])

    renderWithProviders(<ConvitesDeTime />)

    expect(await screen.findByText(/Alex Souza chamou você para o Os Boleiros/)).toBeInTheDocument()
  })

  it('concorda o cabeçalho com a quantidade', async () => {
    listar.mockResolvedValue([criaConviteDeTime()])

    renderWithProviders(<ConvitesDeTime />)

    expect(await screen.findByText('Você tem um convite')).toBeInTheDocument()
  })

  it('usa o plural com mais de um', async () => {
    listar.mockResolvedValue([
      criaConviteDeTime({ id: 'c1' }),
      criaConviteDeTime({ id: 'c2', teamId: 't2' }),
    ])

    renderWithProviders(<ConvitesDeTime />)

    expect(await screen.findByText('Você tem 2 convites')).toBeInTheDocument()
  })

  describe('Responder', () => {
    it('aceitar chama a api e leva para a página do time', async () => {
      const convite = criaConviteDeTime({ id: 'c1', teamId: 'time-9' })
      listar.mockResolvedValue([convite])
      aceitar.mockResolvedValue(convite)

      const { user } = renderWithProviders(<ConvitesDeTime />)
      await user.click(await screen.findByRole('button', { name: /Aceitar/ }))

      await waitFor(() => expect(aceitar).toHaveBeenCalledWith('c1'))
      await waitFor(() => expect(navegar).toHaveBeenCalledWith('/times/time-9'))
    })

    it('recusar chama a api e não navega para lugar nenhum', async () => {
      const convite = criaConviteDeTime({ id: 'c1' })
      listar.mockResolvedValue([convite])
      recusar.mockResolvedValue({ ...convite, status: 'DECLINED' })

      const { user } = renderWithProviders(<ConvitesDeTime />)
      await user.click(await screen.findByRole('button', { name: /Recusar/ }))

      await waitFor(() => expect(recusar).toHaveBeenCalledWith('c1'))
      expect(navegar).not.toHaveBeenCalled()
    })

    it('mostra o erro que a api devolveu', async () => {
      listar.mockResolvedValue([criaConviteDeTime({ id: 'c1' })])
      aceitar.mockRejectedValue(erroDaApi('Este convite já foi respondido', 409))

      const { user } = renderWithProviders(<ConvitesDeTime />)
      await user.click(await screen.findByRole('button', { name: /Aceitar/ }))

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Este convite já foi respondido'),
      )
    })
  })

  describe('Convite vencido', () => {
    /** O critério da issue: aparece como expirado, não some sem explicação. */
    it('aparece na lista, marcado', async () => {
      listar.mockResolvedValue([criaConviteDeTime({ id: 'c1', expired: true })])

      renderWithProviders(<ConvitesDeTime />)

      expect(await screen.findByText('Convite expirado')).toBeInTheDocument()
      expect(screen.getByText(/chamou você para o Os Boleiros/)).toBeInTheDocument()
    })

    it('não oferece aceitar nem recusar', async () => {
      listar.mockResolvedValue([criaConviteDeTime({ id: 'c1', expired: true })])

      renderWithProviders(<ConvitesDeTime />)

      await screen.findByText('Convite expirado')
      expect(screen.queryByRole('button', { name: /Aceitar/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Recusar/ })).not.toBeInTheDocument()
    })

    /**
     * O vencido não pode roubar as ações do válido: os dois convivem na lista,
     * e é a linha certa que precisa continuar respondível.
     */
    it('o convite válido ao lado continua respondível', async () => {
      const valido = criaConviteDeTime({ id: 'valido', teamId: 't1' })
      listar.mockResolvedValue([
        criaConviteDeTime({ id: 'vencido', teamId: 't2', expired: true }),
        valido,
      ])
      aceitar.mockResolvedValue(valido)

      const { user } = renderWithProviders(<ConvitesDeTime />)

      await screen.findByText('Convite expirado')
      const itens = screen.getAllByRole('listitem')
      await user.click(within(itens[1]!).getByRole('button', { name: /Aceitar/ }))

      await waitFor(() => expect(aceitar).toHaveBeenCalledWith('valido'))
    })
  })
})
