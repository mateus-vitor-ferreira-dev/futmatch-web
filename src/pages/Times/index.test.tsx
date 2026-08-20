/**
 * A lista de times do jogador (#217).
 *
 * O caso que mais importa é o vazio: é o estado de todo mundo no primeiro dia,
 * e uma lista vazia sem convite para criar é uma tela que não explica o que
 * fazer — que é o que a issue pede para evitar.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaJogadorDeTime, criaResumoDeTime, criaTime, criaUsuario, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import Times from './index'

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

const listar = vi.mocked(teamsService.meusTimes)
const criar = vi.mocked(teamsService.criar)

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id: 'capitao-1' })))
  vi.mocked(notificationService.list).mockResolvedValue([])
  listar.mockResolvedValue([])
})

describe('Meus Times', () => {
  it('mostra os times do jogador', async () => {
    listar.mockResolvedValue([
      criaResumoDeTime({ id: 't1', name: 'Os Boleiros', city: 'Campinas' }),
      criaResumoDeTime({ id: 't2', name: 'Quarta à Noite', city: 'Santos' }),
    ])

    renderWithProviders(<Times />)

    expect(await screen.findByText('Os Boleiros')).toBeInTheDocument()
    expect(screen.getByText('Quarta à Noite')).toBeInTheDocument()
    expect(screen.getByText('Campinas')).toBeInTheDocument()
  })

  it('o cartão inteiro é um link para a página do time', async () => {
    listar.mockResolvedValue([criaResumoDeTime({ id: 't1', name: 'Os Boleiros' })])

    renderWithProviders(<Times />)

    const link = await screen.findByRole('link', { name: /Os Boleiros/ })
    expect(link).toHaveAttribute('href', '/times/t1')
  })

  it('marca o time que o jogador capitaneia', async () => {
    listar.mockResolvedValue([
      criaResumoDeTime({ id: 't1', name: 'Meu Time', captainId: 'capitao-1' }),
      criaResumoDeTime({
        id: 't2',
        name: 'Time de Outro',
        captain: criaJogadorDeTime({ id: 'outro', name: 'Outro' }),
        captainId: 'outro',
      }),
    ])

    renderWithProviders(<Times />)

    await screen.findByText('Meu Time')
    expect(screen.getAllByText('Você é o capitão')).toHaveLength(1)
  })

  it('mostra a contagem de membros no singular quando é um só', async () => {
    listar.mockResolvedValue([criaResumoDeTime({ _count: { members: 1 } })])

    renderWithProviders(<Times />)

    expect(await screen.findByText('1 jogador')).toBeInTheDocument()
  })

  describe('Estado vazio', () => {
    it('convida a criar o primeiro time', async () => {
      listar.mockResolvedValue([])

      renderWithProviders(<Times />)

      expect(await screen.findByText('Você ainda não tem time')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Criar meu primeiro time/ })).toBeInTheDocument()
    })
  })

  describe('Erro', () => {
    it('explica a falha e oferece tentar de novo', async () => {
      listar.mockRejectedValue(erroDaApi('Servidor indisponível', 500))

      renderWithProviders(<Times />)

      expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível')
      expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    })
  })

  describe('Criação', () => {
    it('cria o time com o que foi preenchido', async () => {
      criar.mockResolvedValue(criaTime({ name: 'Os Boleiros' }))

      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))

      const dialogo = within(screen.getByRole('dialog'))
      await user.type(dialogo.getByLabelText('Nome'), 'Os Boleiros')
      await user.selectOptions(dialogo.getByLabelText('Modalidade principal'), 'FUTSAL')
      await user.type(dialogo.getByLabelText('Cidade'), 'Campinas')
      await user.click(dialogo.getByRole('button', { name: 'Criar time' }))

      await waitFor(() =>
        expect(criar).toHaveBeenCalledWith({ name: 'Os Boleiros', sport: 'FUTSAL', city: 'Campinas' }),
      )
    })

    // Validar aqui evita a viagem até a api só para ouvir 422 de campo vazio.
    it('não chama a api quando falta o nome', async () => {
      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Criar time' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Dê um nome ao time.')
      expect(criar).not.toHaveBeenCalled()
    })

    it('não chama a api quando falta a modalidade', async () => {
      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))
      const dialogo = within(screen.getByRole('dialog'))
      await user.type(dialogo.getByLabelText('Nome'), 'Os Boleiros')
      await user.click(dialogo.getByRole('button', { name: 'Criar time' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Escolha a modalidade principal.')
      expect(criar).not.toHaveBeenCalled()
    })

    it('mostra o erro que a api devolveu, sem fechar o formulário', async () => {
      criar.mockRejectedValue(erroDaApi('Nome já usado', 409))

      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))
      const dialogo = within(screen.getByRole('dialog'))
      await user.type(dialogo.getByLabelText('Nome'), 'Os Boleiros')
      await user.selectOptions(dialogo.getByLabelText('Modalidade principal'), 'FUTSAL')
      await user.type(dialogo.getByLabelText('Cidade'), 'Campinas')
      await user.click(dialogo.getByRole('button', { name: 'Criar time' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Nome já usado')
      expect(screen.getByLabelText('Nome')).toHaveValue('Os Boleiros')
    })

    // Quem navega por teclado ficaria com o cursor no botão atrás do overlay.
    it('leva o foco para o primeiro campo ao abrir', async () => {
      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))

      await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveFocus())
    })

    it('o modal se anuncia como diálogo', async () => {
      const { user } = renderWithProviders(<Times />)

      await user.click(await screen.findByRole('button', { name: /Criar time/ }))

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Criar time')
    })
  })
})
