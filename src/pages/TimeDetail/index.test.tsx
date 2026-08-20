/**
 * A página de um time (#217).
 *
 * Dois eixos que a issue pede por extenso e que este arquivo fixa:
 *
 * - o capitão vê as ações que só ele pode fazer, e o membro comum **não vê
 *   botão que vai dar 403** — mostrar um botão que sempre falha ensina a
 *   pessoa a desconfiar da tela;
 * - a lista de peladas é rota fechada, e por isso nem é pedida por quem está
 *   de fora do time: um 403 no console a cada visita esconde erro de verdade.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import {
  criaJogadorDeTime, criaPeladaDeTime, criaTime, criaUsuario, envelope, erroDaApi,
} from '../../test/factories'
import { marcarSessao } from '../../services/api'
import TimeDetail from './index'

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

const buscarTime = vi.mocked(teamsService.porId)
const buscarPeladas = vi.mocked(teamsService.peladas)
const apagar = vi.mocked(teamsService.apagar)
const editar = vi.mocked(teamsService.editar)

// Nomes de gente, e não "Capitão"/"Membro": com o papel como nome, o selo
// "Capitão" do cartão colide com o nome do jogador e o teste passa a medir
// coincidência de texto em vez do que a tela mostra.
const CAPITAO = criaJogadorDeTime({ id: 'capitao-1', name: 'Alex Souza' })
const MEMBRO = criaJogadorDeTime({ id: 'membro-1', name: 'Sam Ribeiro' })

const timeComDois = () =>
  criaTime({
    id: 'time-1',
    captain: CAPITAO,
    captainId: CAPITAO.id,
    members: [
      { id: 'm1', userId: CAPITAO.id, joinedAt: '2027-01-01T00:00:00.000Z', user: CAPITAO },
      { id: 'm2', userId: MEMBRO.id, joinedAt: '2027-01-02T00:00:00.000Z', user: MEMBRO },
    ],
  })

/** Monta a página já na rota com parâmetro — sem `path`, o useParams vem vazio. */
const montar = () =>
  renderWithProviders(<TimeDetail />, { route: '/times/time-1', path: '/times/:teamId' })

function entrarComo(id: string) {
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id })))
}

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  entrarComo(CAPITAO.id)
  vi.mocked(notificationService.list).mockResolvedValue([])
  buscarTime.mockResolvedValue(timeComDois())
  buscarPeladas.mockResolvedValue([])
})

describe('Página do time', () => {
  it('mostra nome, modalidade, cidade e quem é o capitão', async () => {
    montar()

    expect(await screen.findByRole('heading', { name: 'Os Boleiros' })).toBeInTheDocument()
    expect(screen.getByText('Campinas')).toBeInTheDocument()
    expect(screen.getByText(/Capitão: Alex Souza/)).toBeInTheDocument()
  })

  it('lista os membros e marca o capitão dentro da lista', async () => {
    montar()

    const secao = within(await screen.findByRole('region', { name: 'Membros' }))
    expect(secao.getByText('Alex Souza')).toBeInTheDocument()
    expect(secao.getByText('Sam Ribeiro')).toBeInTheDocument()
    // Um selo de capitão só, no cartão de quem é: o outro cartão diz "Jogador".
    expect(secao.getAllByText('Capitão')).toHaveLength(1)
    expect(secao.getByText('Jogador')).toBeInTheDocument()
  })

  describe('Ações do capitão', () => {
    it('o capitão vê editar e apagar', async () => {
      montar()

      expect(await screen.findByRole('button', { name: /Editar time/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Apagar time/ })).toBeInTheDocument()
    })

    it('membro comum não vê botão que daria 403', async () => {
      entrarComo(MEMBRO.id)

      montar()

      await screen.findByRole('heading', { name: 'Os Boleiros' })
      expect(screen.queryByRole('button', { name: /Editar time/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Apagar time/ })).not.toBeInTheDocument()
    })

    it('quem nem é do time não vê as ações', async () => {
      entrarComo('estranho-1')

      montar()

      await screen.findByRole('heading', { name: 'Os Boleiros' })
      expect(screen.queryByRole('button', { name: /Apagar time/ })).not.toBeInTheDocument()
    })

    it('apagar pede confirmação antes de chamar a api', async () => {
      const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const { user } = montar()
      await user.click(await screen.findByRole('button', { name: /Apagar time/ }))

      expect(confirmar).toHaveBeenCalled()
      expect(apagar).not.toHaveBeenCalled()
      confirmar.mockRestore()
    })

    it('confirmado, apaga e volta para a lista', async () => {
      const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
      apagar.mockResolvedValue(undefined)

      const { user } = montar()
      await user.click(await screen.findByRole('button', { name: /Apagar time/ }))

      await waitFor(() => expect(apagar).toHaveBeenCalledWith('time-1'))
      await waitFor(() => expect(navegar).toHaveBeenCalledWith('/times'))
      confirmar.mockRestore()
    })

    it('edita o time pelo formulário', async () => {
      editar.mockResolvedValue(criaTime({ name: 'Os Boleiros FC' }))

      const { user } = montar()
      await user.click(await screen.findByRole('button', { name: /Editar time/ }))

      const dialogo = within(screen.getByRole('dialog'))
      await user.clear(dialogo.getByLabelText('Nome'))
      await user.type(dialogo.getByLabelText('Nome'), 'Os Boleiros FC')
      await user.click(dialogo.getByRole('button', { name: 'Salvar' }))

      await waitFor(() =>
        expect(editar).toHaveBeenCalledWith('time-1', {
          name: 'Os Boleiros FC',
          sport: 'FUTSAL',
          city: 'Campinas',
        }),
      )
    })

    it('o formulário de edição chega preenchido com o que o time já é', async () => {
      const { user } = montar()
      await user.click(await screen.findByRole('button', { name: /Editar time/ }))

      const dialogo = within(screen.getByRole('dialog'))
      expect(dialogo.getByLabelText('Nome')).toHaveValue('Os Boleiros')
      expect(dialogo.getByLabelText('Cidade')).toHaveValue('Campinas')
    })
  })

  describe('Peladas do time', () => {
    it('lista as peladas com local, situação e vagas', async () => {
      buscarPeladas.mockResolvedValue([
        criaPeladaDeTime({ id: 'p1', status: 'WAITING', maxPlayers: 14, _count: { participations: 5 } }),
      ])

      montar()

      const secao = within(await screen.findByRole('region', { name: 'Peladas do time' }))
      expect(await secao.findByText('Aberta')).toBeInTheDocument()
      expect(secao.getByText('5/14 jogadores')).toBeInTheDocument()
      expect(secao.getByText(/Arena Teste/)).toBeInTheDocument()
    })

    it('cada pelada leva para a página dela', async () => {
      buscarPeladas.mockResolvedValue([criaPeladaDeTime({ id: 'p1' })])

      montar()

      const secao = within(await screen.findByRole('region', { name: 'Peladas do time' }))
      await waitFor(() => expect(secao.getByRole('link')).toHaveAttribute('href', '/pelada/p1'))
    })

    it('time sem pelada mostra o vazio, e não erro', async () => {
      buscarPeladas.mockResolvedValue([])

      montar()

      expect(await screen.findByText(/ainda não jogou nenhuma pelada/)).toBeInTheDocument()
    })

    it('erro na lista de peladas não derruba a página do time', async () => {
      buscarPeladas.mockRejectedValue(erroDaApi('Servidor indisponível', 500))

      montar()

      expect(await screen.findByRole('heading', { name: 'Os Boleiros' })).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Servidor indisponível'))
    })

    // A rota é fechada: pedir o que a api vai recusar polui o console com um
    // 403 por visita e esconde erro de verdade.
    it('quem não é do time nem chega a pedir a lista', async () => {
      entrarComo('estranho-1')

      montar()

      await screen.findByRole('heading', { name: 'Os Boleiros' })
      expect(buscarPeladas).not.toHaveBeenCalled()
      expect(screen.getByText(/visíveis para quem é do time/)).toBeInTheDocument()
    })
  })

  describe('Estados', () => {
    it('time que não existe explica em vez de mostrar tela quebrada', async () => {
      buscarTime.mockRejectedValue(erroDaApi('Time não encontrado', 404, 'TEAM_NOT_FOUND'))

      montar()

      expect(await screen.findByRole('alert')).toHaveTextContent('Este time não existe mais')
    })

    it('falha genérica oferece tentar de novo', async () => {
      buscarTime.mockRejectedValue(erroDaApi('Servidor indisponível', 500))

      montar()

      expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível')
      expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    })
  })
})
