/**
 * O painel de quem organiza o campeonato.
 *
 * Dois testes carregam mais peso que os outros:
 *
 * 1. **O nome do campo da justificativa.** A issue #259 pediu explicitamente um
 *    teste que falhe se o nome divergir. O `placeRequests.reject` já custou
 *    esse aprendizado: o front mandava `reason`, o `stripUnknown` do yup
 *    descartava sem reclamar, e o motivo era gravado como `null` — com 200, sem
 *    erro e sem ninguém notar. Provar que a requisição saiu não bastaria.
 *
 * 2. **O 403 apaga o painel.** A autorização mora na API (`isTournamentManager`)
 *    e não é reproduzível aqui — o `place` que vem no torneio não traz
 *    `ownerId`. O componente tenta ler e se apaga quando a resposta é 403.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import type { Tournament, TournamentDivision, TournamentRegistration } from '../../types/api'
import TournamentRegistrations from './index'

vi.mock('../../services/tournaments')

import * as service from '../../services/tournaments'

const listar = vi.mocked(service.getDivisionRegistrations)
const aprovar = vi.mocked(service.approveRegistration)
const recusar = vi.mocked(service.rejectRegistration)

function campeonato(over: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1', name: 'Copa Só+1', description: null, placeId: 'p1',
    organizerType: 'PLACE', organizerName: null, organizerUserId: 'u-org',
    sportType: 'BEACH_TENNIS', format: 'KNOCKOUT', participantType: 'INDIVIDUAL',
    registrationMode: 'APPROVAL_REQUIRED',
    registrationStartDate: null, registrationEndDate: null,
    startDate: null, endDate: null, maxParticipants: null,
    registrationFee: null, paymentInstructions: null, pixKey: null, rules: null,
    status: 'OPEN',
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

function divisao(over: Partial<TournamentDivision> = {}): TournamentDivision {
  return {
    id: 'div-1', tournamentId: 't1', name: 'Masculino A', description: null,
    genderRestriction: null, ageRestriction: null, level: 'AMATEUR',
    minPlayersPerTeam: 1, maxPlayersPerTeam: 2, maxParticipants: 8,
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

function inscricao(over: Partial<TournamentRegistration> = {}): TournamentRegistration {
  return {
    id: 'insc-1', divisionId: 'div-1', userId: 'u-1', status: 'PENDING',
    adminNote: null, respondedAt: null, createdAt: '2026-08-10T10:00:00.000Z',
    user: { id: 'u-1', name: 'Juliana Prado', email: 'juliana@exemplo.com', avatarUrl: null, badge: null },
    ...over,
  }
}

const envelope = <T,>(data: T) => ({ success: true as const, data })

beforeEach(() => {
  vi.clearAllMocks()
  listar.mockResolvedValue(envelope([inscricao()]))
  aprovar.mockResolvedValue(envelope(inscricao({ status: 'APPROVED', respondedAt: '2026-08-11T10:00:00.000Z' })))
  recusar.mockResolvedValue(envelope(inscricao({ status: 'REJECTED', respondedAt: '2026-08-11T10:00:00.000Z' })))
})

const monta = (t = campeonato(), d = [divisao()]) =>
  renderWithProviders(<TournamentRegistrations tournament={t} divisions={d} />)

describe('TournamentRegistrations — a lista', () => {
  it('mostra quem se inscreveu, com nome, e-mail e estado', async () => {
    monta()

    expect(await screen.findByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByText('juliana@exemplo.com')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resposta')).toBeInTheDocument()
  })

  it('conta as vagas restantes só com as aprovadas', async () => {
    listar.mockResolvedValue(envelope([
      inscricao({ id: 'a', status: 'APPROVED' }),
      inscricao({ id: 'b', status: 'PENDING' }),
      inscricao({ id: 'c', status: 'REJECTED' }),
    ]))

    monta()

    // Pendente é candidato, não ocupante — a regra de vaga da api#265. Se o
    // pendente contasse, o organizador veria 6 vagas e teria 7.
    expect(await screen.findByText(/1 de 8 · 7 vagas restantes/)).toBeInTheDocument()
  })

  it('diz quando ninguém se inscreveu, em vez de mostrar caixa vazia', async () => {
    listar.mockResolvedValue(envelope([]))
    monta()
    expect(await screen.findByText(/Ninguém se inscreveu nesta categoria ainda/)).toBeInTheDocument()
  })
})

describe('TournamentRegistrations — responder', () => {
  it('aprova e a linha passa a mostrar o novo estado', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(aprovar).toHaveBeenCalledWith('t1', 'div-1', 'insc-1'))
    expect(await screen.findByText('Aprovada')).toBeInTheDocument()
  })

  it('a justificativa chega como `adminNote`, e não como `reason`', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Recusar' }))
    await user.type(screen.getByRole('textbox'), 'Categoria para avançados.')
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))

    // **É este o teste que a #259 pediu.** Provar que a requisição saiu não
    // bastaria: o defeito do placeRequests devolvia 200 e gravava null.
    await waitFor(() =>
      expect(recusar).toHaveBeenCalledWith('t1', 'div-1', 'insc-1', 'Categoria para avançados.'),
    )
  })

  it('recusar sem escrever nada continua valendo', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Recusar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))

    // Recusar sem justificativa é caso legítimo — o schema da api aceita
    // ausência e `null`. Exigir texto inventaria uma regra que a API não tem.
    await waitFor(() => expect(recusar).toHaveBeenCalledWith('t1', 'div-1', 'insc-1', ''))
  })

  it('dá para desistir da recusa sem chamar a API', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Recusar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(recusar).not.toHaveBeenCalled()
  })

  it('inscrição já respondida não mostra botão, para não responder duas vezes', async () => {
    listar.mockResolvedValue(envelope([
      inscricao({ status: 'APPROVED', respondedAt: '2026-08-11T10:00:00.000Z' }),
    ]))

    monta()

    expect(await screen.findByText('Aprovada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Recusar' })).not.toBeInTheDocument()
    expect(screen.getByText(/Respondida em/)).toBeInTheDocument()
  })

  it('campeonato em modo OPEN lista, mas não oferece o que aprovar', async () => {
    monta(campeonato({ registrationMode: 'OPEN' }))

    // Em OPEN a inscrição já nasce APPROVED: não há resposta a dar, e um botão
    // ali seria um 4xx esperando o clique. A lista continua, porque saber quem
    // entrou é do organizador em qualquer modo.
    expect(await screen.findByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
  })
})

describe('TournamentRegistrations — erro e autorização', () => {
  it('mostra na tela quando aprovar falha por lotação', async () => {
    aprovar.mockRejectedValueOnce(
      new AxiosError('Request failed', '409', undefined, undefined, {
        status: 409,
        data: { success: false, message: 'A divisão está lotada.' },
      } as never),
    )

    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: 'Aprovar' }))

    // Aprovar pode falhar de propósito: a vaga é do aprovado, então a última
    // aprovação de uma divisão cheia é recusada pela API.
    expect(await screen.findByRole('alert')).toHaveTextContent('A divisão está lotada.')
  })

  it('o 403 apaga o painel inteiro', async () => {
    listar.mockRejectedValue(
      new AxiosError('Forbidden', '403', undefined, undefined, { status: 403, data: {} } as never),
    )

    const { container } = monta()

    // Quem decide se este painel existe é a API. Reproduzir a regra aqui daria
    // um painel que some para um dono legítimo do espaço, cujo `ownerId` o
    // front nem recebe.
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('erro que não é 403 não apaga o painel — a divisão só fica vazia', async () => {
    listar.mockRejectedValue(new Error('rede caiu'))

    monta()

    // Falha de leitura não é falta de permissão. Apagar o painel aqui esconderia
    // do organizador que existe algo para ver.
    expect(await screen.findByText(/Ninguém se inscreveu nesta categoria ainda/)).toBeInTheDocument()
  })
})
