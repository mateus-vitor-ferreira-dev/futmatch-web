/**
 * A tela de inscrição é onde o produto mais mente se for otimista (#258).
 *
 * O defeito que esta suíte existe para impedir é o da web#250: um botão que
 * abre, o usuário clica, e só então descobre que não podia. Por isso quase todo
 * teste aqui confere **duas coisas juntas** — que o botão está desabilitado e
 * que o motivo está escrito na tela. Um sem o outro deixa o usuário adivinhando.
 */
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import DivisionRegistration from './index'
import type { Tournament, TournamentDivision, TournamentRegistration } from '../../types/api'

vi.mock('../../services/tournaments')
import {
  cancelRegistration,
  getMyRegistrations,
  registerInDivision,
} from '../../services/tournaments'

const auth = vi.hoisted(() => ({ estado: { isAuthenticated: true } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const buscaMinhas = vi.mocked(getMyRegistrations)
const inscreve = vi.mocked(registerInDivision)
const cancela = vi.mocked(cancelRegistration)

const DIA = 24 * 60 * 60 * 1000

function campeonato(over: Partial<Tournament> = {}): Tournament {
  return {
    id: 'copa-1',
    name: 'Copa de Primavera',
    description: null,
    placeId: 'place-1',
    organizerType: 'PLACE',
    organizerName: null,
    organizerUserId: null,
    sportType: 'FUTSAL',
    format: 'KNOCKOUT',
    participantType: 'INDIVIDUAL',
    registrationMode: 'OPEN',
    registrationStartDate: null,
    registrationEndDate: null,
    startDate: null,
    endDate: null,
    maxParticipants: null,
    registrationFee: null,
    paymentInstructions: null,
    pixKey: null,
    rules: null,
    status: 'OPEN',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

function divisao(over: Partial<TournamentDivision> = {}): TournamentDivision {
  return {
    id: 'div-1',
    tournamentId: 'copa-1',
    name: 'Masculino A',
    description: null,
    genderRestriction: null,
    ageRestriction: null,
    level: 'AMATEUR',
    minPlayersPerTeam: 1,
    maxPlayersPerTeam: 1,
    maxParticipants: 8,
    thirdPlaceMatch: false,
    _count: { approvedRegistrations: 3 },
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

function inscricao(over: Partial<TournamentRegistration> = {}): TournamentRegistration {
  return {
    id: 'insc-1',
    divisionId: 'div-1',
    userId: 'user-1',
    status: 'APPROVED',
    adminNote: null,
    respondedAt: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    ...over,
  }
}

/** Erro do axios como as páginas o recebem: mensagem dentro do corpo. */
function erroDaApi(message: string, code: string, status = 422) {
  const err = new AxiosError(message)
  err.response = { data: { success: false, message, code }, status } as never
  return err
}

function montar(t = campeonato(), d = [divisao()]) {
  return renderWithProviders(<DivisionRegistration tournament={t} divisions={d} />)
}

describe('DivisionRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.estado.isAuthenticated = true
    buscaMinhas.mockResolvedValue({ success: true, data: [] })
  })

  describe('vagas', () => {
    it('mostra quantas vagas já foram ocupadas', async () => {
      montar()
      expect(await screen.findByText('3 de 8 vagas')).toBeInTheDocument()
    })

    it('divisão sem limite conta inscritos, e não vagas', async () => {
      montar(campeonato(), [divisao({ maxParticipants: null, _count: { approvedRegistrations: 5 } })])
      expect(await screen.findByText('5 inscritos')).toBeInTheDocument()
    })

    /*
     * O caso que a api#314 existe para permitir: lotada aparece ANTES do
     * clique. Sem a contagem, este teste só poderia checar o 422 depois.
     */
    it('divisão lotada desabilita o botão e diz o motivo', async () => {
      montar(campeonato(), [divisao({ maxParticipants: 8, _count: { approvedRegistrations: 8 } })])

      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeDisabled()
      expect(screen.getByText('Esta categoria está com as vagas esgotadas.')).toBeInTheDocument()
    })
  })

  describe('estados do campeonato', () => {
    it.each([
      ['DRAFT', 'Este campeonato ainda não foi publicado pelo organizador.'],
      ['REGISTRATION_CLOSED', 'As inscrições deste campeonato já encerraram.'],
      ['IN_PROGRESS', 'Este campeonato já começou.'],
      ['FINISHED', 'Este campeonato já terminou.'],
      ['CANCELLED', 'Este campeonato foi cancelado.'],
    ] as const)('%s tem texto próprio, e não um "não é possível" genérico', async (status, texto) => {
      montar(campeonato({ status }))

      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeDisabled()
      expect(screen.getByText(texto)).toBeInTheDocument()
    })

    it('antes da janela, mostra a data em que as inscrições abrem', async () => {
      const abre = new Date(Date.now() + 3 * DIA).toISOString()
      montar(campeonato({ registrationStartDate: abre }))

      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeDisabled()
      expect(screen.getByText(/As inscrições abrem em/)).toBeInTheDocument()
    })

    it('depois da janela, mostra a data em que encerraram', async () => {
      const fechou = new Date(Date.now() - 2 * DIA).toISOString()
      montar(campeonato({ registrationEndDate: fechou }))

      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeDisabled()
      expect(screen.getByText(/As inscrições encerraram em/)).toBeInTheDocument()
    })

    it('campeonato por equipe explica que a inscrição individual não serve', async () => {
      montar(campeonato({ participantType: 'TEAM' }))

      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeDisabled()
      expect(screen.getByText(/por equipe/)).toBeInTheDocument()
    })
  })

  describe('estados da minha inscrição', () => {
    it('aprovada mostra o estado e como sair', async () => {
      buscaMinhas.mockResolvedValue({ success: true, data: [inscricao()] })
      montar()

      expect(await screen.findByText('Você está inscrito')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar inscrição' })).toBeEnabled()
      expect(screen.queryByRole('button', { name: 'Inscrever-se' })).not.toBeInTheDocument()
    })

    it('pendente diz que está esperando o organizador', async () => {
      buscaMinhas.mockResolvedValue({ success: true, data: [inscricao({ status: 'PENDING' })] })
      montar()

      expect(await screen.findByText('Aguardando o organizador')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar inscrição' })).toBeInTheDocument()
    })

    it('recusada mostra o motivo escrito pelo organizador', async () => {
      buscaMinhas.mockResolvedValue({
        success: true,
        data: [inscricao({ status: 'REJECTED', adminNote: 'Divisão iniciante — seu nível é avançado' })],
      })
      montar()

      expect(await screen.findByText('Inscrição recusada')).toBeInTheDocument()
      expect(screen.getByText(/Divisão iniciante/)).toBeInTheDocument()
    })

    /** Recusado tenta de novo: foi o organizador que disse não, e ele pode mudar. */
    it('recusada oferece tentar de novo, e não cancelar', async () => {
      buscaMinhas.mockResolvedValue({ success: true, data: [inscricao({ status: 'REJECTED' })] })
      montar()

      expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeEnabled()
      expect(screen.queryByRole('button', { name: 'Cancelar inscrição' })).not.toBeInTheDocument()
    })

    it('com o campeonato fora de OPEN, cancelar fica bloqueado e explicado', async () => {
      buscaMinhas.mockResolvedValue({ success: true, data: [inscricao()] })
      montar(campeonato({ status: 'REGISTRATION_CLOSED' }))

      expect(await screen.findByRole('button', { name: 'Cancelar inscrição' })).toBeDisabled()
      expect(screen.getByText(/Não dá mais para cancelar/)).toBeInTheDocument()
    })
  })

  describe('inscrever e cancelar', () => {
    it('inscreve, e o estado muda na hora — sem recarregar', async () => {
      inscreve.mockResolvedValue({ success: true, data: inscricao() })
      const { user } = montar()

      await user.click(await screen.findByRole('button', { name: 'Inscrever-se' }))

      expect(inscreve).toHaveBeenCalledWith('copa-1', 'div-1')
      expect(await screen.findByText('Você está inscrito')).toBeInTheDocument()
      // A vaga sai do contador no mesmo clique.
      expect(screen.getByText('4 de 8 vagas')).toBeInTheDocument()
    })

    /** Em APPROVAL_REQUIRED a inscrição nasce PENDING — e pendente não ocupa vaga. */
    it('inscrição pendente não consome vaga no contador', async () => {
      inscreve.mockResolvedValue({ success: true, data: inscricao({ status: 'PENDING' }) })
      const { user } = montar(campeonato({ registrationMode: 'APPROVAL_REQUIRED' }))

      await user.click(await screen.findByRole('button', { name: 'Inscrever-se' }))

      expect(await screen.findByText('Aguardando o organizador')).toBeInTheDocument()
      expect(screen.getByText('3 de 8 vagas')).toBeInTheDocument()
    })

    it('cancela e a tela volta ao estado inicial', async () => {
      buscaMinhas.mockResolvedValue({ success: true, data: [inscricao()] })
      cancela.mockResolvedValue({ success: true, data: inscricao() })
      const { user } = montar()

      await user.click(await screen.findByRole('button', { name: 'Cancelar inscrição' }))

      expect(cancela).toHaveBeenCalledWith('copa-1', 'div-1', 'insc-1')
      expect(await screen.findByRole('button', { name: 'Inscrever-se' })).toBeInTheDocument()
      expect(screen.queryByText('Você está inscrito')).not.toBeInTheDocument()

      /*
       * 2, e não 3: a contagem que a API mandou **já me incluía** — eu era uma
       * das três aprovadas. Sair da divisão devolve a vaga.
       */
      expect(screen.getByText('2 de 8 vagas')).toBeInTheDocument()
    })

    /*
     * O erro fica NA TELA. Um toast some em segundos, e quem clicou precisa
     * poder reler o motivo enquanto decide o que fazer.
     */
    it('erro da API aparece na tela, com a mensagem que a API mandou', async () => {
      inscreve.mockRejectedValue(erroDaApi('Esta divisão está com as vagas esgotadas', 'DIVISION_FULL'))
      const { user } = montar()

      await user.click(await screen.findByRole('button', { name: 'Inscrever-se' }))

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('Esta divisão está com as vagas esgotadas')
    })

    it('erro numa divisão não contamina a outra', async () => {
      inscreve.mockRejectedValue(erroDaApi('Você já está inscrito nesta divisão', 'ALREADY_REGISTERED', 409))
      const { user } = montar(campeonato(), [
        divisao(),
        divisao({ id: 'div-2', name: 'Feminino A' }),
      ])

      const botoes = await screen.findAllByRole('button', { name: 'Inscrever-se' })
      await user.click(botoes[0])

      await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
    })
  })

  describe('visitante', () => {
    it('sem sessão, convida a entrar e não mostra botão de inscrição', async () => {
      auth.estado.isAuthenticated = false
      montar()

      expect(await screen.findByRole('button', { name: 'Entre na sua conta' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Inscrever-se' })).not.toBeInTheDocument()
      // As vagas continuam visíveis: leitura de campeonato é pública.
      expect(screen.getByText('3 de 8 vagas')).toBeInTheDocument()
    })

    it('sem sessão, não pede as inscrições do usuário', async () => {
      auth.estado.isAuthenticated = false
      montar()

      await screen.findByText('3 de 8 vagas')
      expect(buscaMinhas).not.toHaveBeenCalled()
    })
  })

  /**
   * Falhar ao ler as próprias inscrições não pode apagar a lista de categorias:
   * as vagas são leitura pública e continuam valendo.
   */
  it('sobrevive a erro ao carregar as próprias inscrições', async () => {
    buscaMinhas.mockRejectedValue(new Error('rede caiu'))
    montar()

    expect(await screen.findByText('Masculino A')).toBeInTheDocument()
    expect(screen.getByText('3 de 8 vagas')).toBeInTheDocument()
  })
})
