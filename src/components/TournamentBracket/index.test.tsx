/**
 * O chaveamento não pode inventar participante.
 *
 * Até 15/08 este componente desenhava um bracket inteiro a partir de uma
 * `buildSimulatedBracket`, que gerava `Time 1` … `Time 8` do nada e montava
 * quartas, semifinal e final com esses nomes. O dono via um confronto que nunca
 * foi sorteado, porque não existia inscrição no sistema. Ver #256.
 *
 * Agora existe partida de verdade na API, e o componente desenha a chave a
 * partir dela. **O teste central continua sendo o negativo**: nada com cara de
 * participante aparece na tela sem ter vindo da API. É ele que cai se alguém
 * trouxer a simulação de volta, por saudade do visual.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { lightTheme } from '../../styles/theme'
import TournamentBracket from './index'
import type { TournamentDivision, TournamentMatch, TournamentMatchSide } from '../../types/api'

vi.mock('../../services/tournaments')

import { getTournamentDivisions, getDivisionMatches } from '../../services/tournaments'

const buscaDivisoes = vi.mocked(getTournamentDivisions)
const buscaPartidas = vi.mocked(getDivisionMatches)

function divisao(over: Partial<TournamentDivision> = {}): TournamentDivision {
  return {
    id: 'div-1',
    tournamentId: 'torneio-1',
    name: 'Masculino A',
    description: null,
    genderRestriction: null,
    ageRestriction: null,
    level: 'AMATEUR',
    minPlayersPerTeam: 1,
    maxPlayersPerTeam: 2,
    // 8 vagas era exatamente o que fazia a simulação montar quartas de final.
    maxParticipants: 8,
    thirdPlaceMatch: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

/** O lado do confronto é uma INSCRIÇÃO, com o usuário dentro. */
function lado(id: string, nome: string): TournamentMatchSide {
  return { id, status: 'APPROVED', user: { id: `user-${id}`, name: nome, avatarUrl: null, badge: null } }
}

function partida(over: Partial<TournamentMatch> = {}): TournamentMatch {
  return {
    id: 'partida-1',
    divisionId: 'div-1',
    round: 1,
    orderInRound: 1,
    participantAId: null,
    participantBId: null,
    nextMatchId: null,
    loserNextMatchId: null,
    courtId: null,
    scheduledAt: null,
    status: 'PENDING',
    scoreA: null,
    scoreB: null,
    winnerId: null,
    refereeId: null,
    participantA: null,
    participantB: null,
    winner: null,
    court: null,
    referee: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  }
}

const juliana = lado('insc-1', 'Juliana Prado')
const aline   = lado('insc-2', 'Aline Duarte')
const marcelo = lado('insc-3', 'Marcelo Vidal')
const caio    = lado('insc-4', 'Caio Peçanha')

/** Uma chave de 4: duas semifinais decididas e a final entre os vencedores. */
const CHAVE_DE_QUATRO: TournamentMatch[] = [
  partida({
    id: 'semi-1', round: 1, orderInRound: 1, nextMatchId: 'final-1',
    participantA: juliana, participantAId: 'insc-1',
    participantB: aline,   participantBId: 'insc-2',
    winner: juliana, winnerId: 'insc-1',
    status: 'FINISHED', scoreA: 12, scoreB: 10,
  }),
  partida({
    id: 'semi-2', round: 1, orderInRound: 2, nextMatchId: 'final-1',
    participantA: marcelo, participantAId: 'insc-3',
    participantB: caio,    participantBId: 'insc-4',
    winner: marcelo, winnerId: 'insc-3',
    status: 'FINISHED', scoreA: 12, scoreB: 8,
  }),
  partida({
    id: 'final-1', round: 2, orderInRound: 1,
    participantA: juliana, participantAId: 'insc-1',
    participantB: marcelo, participantBId: 'insc-3',
    winner: juliana, winnerId: 'insc-1',
    status: 'FINISHED', scoreA: 15, scoreB: 9,
  }),
]

beforeEach(() => {
  vi.clearAllMocks()
  buscaDivisoes.mockResolvedValue({ success: true, data: [] })
  buscaPartidas.mockResolvedValue({ success: true, data: [] })
})

describe('TournamentBracket — divisão sem chaveamento', () => {
  it('não inventa participante nenhum quando a divisão tem vagas', async () => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText(/Masculino A/)
    // Os nomes que a simulação gerava. Nenhum deles saía da API.
    expect(screen.queryByText(/Time \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/A definir/)).not.toBeInTheDocument()
    // As fases que ela montava, e a caixa de campeão.
    expect(screen.queryByText(/Quartas de [Ff]inal/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Semifinal/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Final$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Campeão/)).not.toBeInTheDocument()
  })

  it('mostra a divisão com nome e nível, que são dado real da API', async () => {
    buscaDivisoes.mockResolvedValue({
      success: true,
      data: [divisao({ name: 'Feminino B', level: 'ADVANCED' })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText(/Feminino B/)).toBeInTheDocument()
    expect(screen.getByText('Avançado')).toBeInTheDocument()
  })

  it('diz que o chaveamento ainda não existe, uma vez por divisão', async () => {
    buscaDivisoes.mockResolvedValue({
      success: true,
      data: [divisao(), divisao({ id: 'div-2', name: 'Feminino B' })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText(/Masculino A/)
    expect(screen.getAllByText(/ainda não foi gerado/)).toHaveLength(2)
  })

  it('mantém o estado vazio quando o torneio não tem divisão', async () => {
    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(
      await screen.findByText(/O chaveamento ainda não foi gerado para este torneio/),
    ).toBeInTheDocument()
  })

  it('não busca partida nenhuma quando o torneio não tem divisão', async () => {
    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText(/O chaveamento ainda não foi gerado para este torneio/)
    expect(buscaPartidas).not.toHaveBeenCalled()
  })

  it('não quebra quando a API falha — cai no estado vazio', async () => {
    buscaDivisoes.mockRejectedValue(new Error('fora do ar'))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(
      await screen.findByText(/O chaveamento ainda não foi gerado para este torneio/),
    ).toBeInTheDocument()
  })

  it('não busca nada sem tournamentId', async () => {
    renderWithProviders(<TournamentBracket tournamentId="" />)

    await waitFor(() => expect(buscaDivisoes).not.toHaveBeenCalled())
  })
})

describe('TournamentBracket — chaveamento vindo da API', () => {
  beforeEach(() => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })
  })

  it('desenha os confrontos com os nomes que vieram da API', async () => {
    buscaPartidas.mockResolvedValue({ success: true, data: CHAVE_DE_QUATRO })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // Semifinal, final e a caixa de campeão: a final da CHAVE_DE_QUATRO está
    // encerrada, e desde a #292 quem a vence aparece também fora da chave.
    expect(await screen.findAllByText('Juliana Prado')).toHaveLength(3)
    expect(screen.getByText('Aline Duarte')).toBeInTheDocument()
    expect(screen.getByText('Caio Peçanha')).toBeInTheDocument()
    expect(screen.queryByText(/ainda não foi gerado/)).not.toBeInTheDocument()
  })

  it('nomeia as fases de trás para frente: a última rodada é a final', async () => {
    buscaPartidas.mockResolvedValue({ success: true, data: CHAVE_DE_QUATRO })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('Semifinal')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
    // Com duas rodadas não existem quartas — o nome vem da distância até o fim,
    // e não do número de inscritos.
    expect(screen.queryByText(/Quartas/)).not.toBeInTheDocument()
  })

  it('mostra o placar e destaca o vencedor', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [CHAVE_DE_QUATRO[2]], // só a final: 15 x 9 para a Juliana
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('15')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    // Procurado dentro da rodada, e não na tela toda: esta final está encerrada,
    // então a caixa de campeão da #292 também está lá com o nome da Juliana.
    const rodada = screen.getByTestId('rodada-da-chave')
    expect(within(rodada).getByText('Juliana Prado')).toHaveStyle({ color: lightTheme.colors.primaryDark })
    expect(within(rodada).getByText('Marcelo Vidal')).not.toHaveStyle({ color: lightTheme.colors.primaryDark })
  })

  it('escreve "A definir" no lado que a chave ainda não conhece', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [partida({ participantA: juliana, participantAId: 'insc-1' })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByText('A definir')).toBeInTheDocument()
  })

  it('não mostra placar em partida que não terminou', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [partida({
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline,   participantBId: 'insc-2',
        status: 'SCHEDULED',
      })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText('Juliana Prado')
    // Zero é um placar. Partida que não começou não tem nenhum.
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('etiqueta o W.O., que é vencedor sem placar que o explique', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [partida({
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline,   participantBId: 'insc-2',
        winner: juliana, winnerId: 'insc-1',
        status: 'WALKOVER',
      })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('W.O.')).toBeInTheDocument()
    // Dentro da rodada: partida única é partida sem destino, ou seja, é a final
    // — e W.O. encerrado também acende a caixa de campeão da #292.
    const rodada = screen.getByTestId('rodada-da-chave')
    expect(within(rodada).getByText('Juliana Prado')).toHaveStyle({ color: lightTheme.colors.primaryDark })
  })

  it('etiqueta a partida que está rolando agora', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [partida({
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline,   participantBId: 'insc-2',
        status: 'IN_PROGRESS',
      })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('Em andamento')).toBeInTheDocument()
  })

  it('mostra quadra e árbitro quando a partida os tem', async () => {
    buscaPartidas.mockResolvedValue({
      success: true,
      data: [partida({
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline,   participantBId: 'insc-2',
        status: 'SCHEDULED',
        scheduledAt: '2026-08-20T12:00:00.000Z',
        court: { id: 'quadra-1', name: 'Tênis 1', type: 'TENIS' },
        referee: { id: 'user-9', name: 'Rafael Quintão', avatarUrl: null, badge: null },
      })],
    })

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // A data entra no meio, formatada no fuso de quem roda o teste — por isso o
    // curinga: o que este teste garante é quadra e árbitro, não o formato.
    expect(await screen.findByText(/Tênis 1 · .* · árb\. Rafael Quintão/)).toBeInTheDocument()
  })

  it('pede a chave de cada divisão, e uma que falhe não apaga as outras', async () => {
    buscaDivisoes.mockResolvedValue({
      success: true,
      data: [divisao(), divisao({ id: 'div-2', name: 'Feminino B' })],
    })
    buscaPartidas.mockImplementation((_torneio, divisionId) =>
      divisionId === 'div-1'
        ? Promise.resolve({ success: true as const, data: CHAVE_DE_QUATRO })
        : Promise.reject(new Error('fora do ar')),
    )

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // A que respondeu continua desenhada...
    expect(await screen.findByText('Aline Duarte')).toBeInTheDocument()
    // ...e a que falhou cai no aviso, em vez de derrubar a tela inteira.
    expect(screen.getByText(/ainda não foi gerado/)).toBeInTheDocument()
    expect(buscaPartidas).toHaveBeenCalledTimes(2)
  })
})

/**
 * A forma da chave, e o que o bye faz com ela.
 *
 * A `bracket.ts` da api **não cria a partida de bye**: quem passa direto já
 * nasce dentro da vaga da segunda rodada, para a tela não desenhar um jogo que
 * ninguém jogou. O preço é que a primeira rodada tem menos partidas que vagas,
 * e as que sobraram vêm renumeradas de 1 em diante.
 *
 * Layout de bracket é altura, e altura o jsdom não calcula. Então estes testes
 * não olham pixel: olham a **estrutura que produz a altura**. A invariante é
 * uma só — *a primeira rodada tem exatamente uma faixa por vaga da segunda* —,
 * e ela vale com a chave cheia (duas partidas por faixa), com um bye (uma) e
 * com dois (nenhuma, e a faixa fica lá vazia guardando o lugar). É ela que
 * quebrava quando o espaçamento era calculado a partir da contagem de
 * partidas, que o bye reduz.
 */
describe('TournamentBracket — a forma da chave', () => {
  const comChave = (partidas: TournamentMatch[]) => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })
    buscaPartidas.mockResolvedValue({ success: true, data: partidas })
  }

  /** As faixas de cada rodada, na ordem em que aparecem na tela. */
  async function faixasPorRodada(): Promise<HTMLElement[][]> {
    const rodadas = await screen.findAllByTestId('rodada-da-chave')
    return rodadas.map((rodada) => [
      ...rodada.querySelectorAll<HTMLElement>('[data-testid="faixa-da-chave"]'),
    ])
  }

  it('chave de 2: uma rodada só, e ela é a final', async () => {
    comChave([
      partida({
        id: 'final-1', round: 1, orderInRound: 1, nextMatchId: null,
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline, participantBId: 'insc-2',
      }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const faixas = await faixasPorRodada()
    expect(faixas).toHaveLength(1)
    expect(faixas[0]).toHaveLength(1)
    // Com dois inscritos não existe segunda rodada de onde tirar vaga. A conta
    // que nomeia a fase de trás para frente precisa dizer "Final" mesmo assim.
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.queryByText('Semifinal')).not.toBeInTheDocument()
  })

  it('chave de 4: as duas semis dividem a faixa da final', async () => {
    comChave(CHAVE_DE_QUATRO)

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const faixas = await faixasPorRodada()
    // Uma faixa em cada rodada — e as duas semifinais dentro da faixa da vaga
    // que elas alimentam, que é o que as coloca em 1/4 e 3/4 da altura dela.
    expect(faixas.map((r) => r.length)).toEqual([1, 1])
    expect(faixas[0][0].children).toHaveLength(2)
    expect(screen.getByText('Semifinal')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
  })

  it('chave de 8 cheia: cada faixa da primeira rodada tem os dois confrontos que a alimentam', async () => {
    comChave([
      ...['q1', 'q2', 'q3', 'q4'].map((id, i) =>
        partida({
          id, round: 1, orderInRound: i + 1,
          nextMatchId: i < 2 ? 'semi-1' : 'semi-2',
          participantA: lado(`a-${id}`, `Jogadora ${id}`), participantAId: `a-${id}`,
          participantB: lado(`b-${id}`, `Jogador ${id}`), participantBId: `b-${id}`,
        }),
      ),
      partida({ id: 'semi-1', round: 2, orderInRound: 1, nextMatchId: 'final-1' }),
      partida({ id: 'semi-2', round: 2, orderInRound: 2, nextMatchId: 'final-1' }),
      partida({ id: 'final-1', round: 3, orderInRound: 1, nextMatchId: null }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const faixas = await faixasPorRodada()
    // Faixa é VAGA, não partida: as 4 quartas ocupam as 2 vagas da semifinal,
    // duas em cada. É o mesmo número de faixas da rodada seguinte, e é isso que
    // faz as colunas terminarem na mesma altura.
    expect(faixas.map((r) => r.length)).toEqual([2, 2, 1])
    expect(faixas[0].every((f) => f.children.length === 2)).toBe(true)
    // Chave cheia: nenhuma faixa vazia, porque não houve bye.
    expect(faixas.flat().some((f) => f.children.length === 0)).toBe(false)
    expect(screen.getByText('Quartas de final')).toBeInTheDocument()
  })

  it('bye: a primeira rodada tem uma faixa por vaga da segunda, e não por partida', async () => {
    // Seis inscritos numa chave de 8. A api dá bye às vagas 1 e 3, sobram duas
    // partidas na primeira rodada — uma alimentando cada semifinal.
    comChave([
      partida({
        id: 'q1', round: 1, orderInRound: 1, nextMatchId: 'semi-1',
        participantA: marcelo, participantAId: 'insc-3',
        participantB: caio, participantBId: 'insc-4',
      }),
      partida({
        id: 'q2', round: 1, orderInRound: 2, nextMatchId: 'semi-2',
        participantA: lado('insc-5', 'Rita Almeida'), participantAId: 'insc-5',
        participantB: lado('insc-6', 'Tiago Nunes'), participantBId: 'insc-6',
      }),
      // Quem passou direto já está aqui, com o outro lado esperando o vencedor.
      partida({
        id: 'semi-1', round: 2, orderInRound: 1, nextMatchId: 'final-1',
        participantA: juliana, participantAId: 'insc-1',
      }),
      partida({
        id: 'semi-2', round: 2, orderInRound: 2, nextMatchId: 'final-1',
        participantA: aline, participantAId: 'insc-2',
      }),
      partida({ id: 'final-1', round: 3, orderInRound: 1, nextMatchId: null }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const faixas = await faixasPorRodada()
    // Duas partidas na primeira rodada, mas DUAS vagas de destino: uma faixa
    // para cada. Com o gap dobrado antigo, as duas ficavam coladas no topo e a
    // chave escorregava — a semifinal não caía na altura de quem a alimenta.
    expect(faixas.map((r) => r.length)).toEqual([2, 2, 1])
    expect(faixas[0].every((f) => f.children.length === 1)).toBe(true)

    // Quem veio de bye aparece pelo nome, do lado que a api preencheu; o outro
    // lado espera o vencedor. Os dois saíram da resposta, nenhum foi inventado.
    expect(screen.getByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getAllByText('A definir').length).toBeGreaterThan(0)
  })

  it('bye dos dois lados: a vaga fica vazia na primeira rodada, e não some', async () => {
    // Cinco inscritos numa chave de 8: três byes. A primeira semifinal se enche
    // só de gente que passou direto, e sobra UMA partida na primeira rodada.
    comChave([
      partida({
        id: 'q1', round: 1, orderInRound: 1, nextMatchId: 'semi-2',
        participantA: lado('insc-4', 'Rita Almeida'), participantAId: 'insc-4',
        participantB: lado('insc-5', 'Tiago Nunes'), participantBId: 'insc-5',
      }),
      partida({
        id: 'semi-1', round: 2, orderInRound: 1, nextMatchId: 'final-1',
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline, participantBId: 'insc-2',
      }),
      partida({
        id: 'semi-2', round: 2, orderInRound: 2, nextMatchId: 'final-1',
        participantA: marcelo, participantAId: 'insc-3',
      }),
      partida({ id: 'final-1', round: 3, orderInRound: 1, nextMatchId: null }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const faixas = await faixasPorRodada()
    expect(faixas.map((r) => r.length)).toEqual([2, 2, 1])

    // **A faixa vazia é o ponto do teste.** Ela guarda o espaço da vaga cujos
    // dois lados vieram de bye. Sem ela a única partida da primeira rodada
    // subiria para o topo da coluna e apontaria para a semifinal errada.
    expect(faixas[0][0].children).toHaveLength(0)
    expect(faixas[0][1].children).toHaveLength(1)
    expect(faixas[0][1]).toHaveTextContent('Rita Almeida')
  })

  it('partida sem destino conhecido continua na tela', async () => {
    // Rede contra dado inesperado: `nextMatchId` que não bate com nenhuma vaga
    // da segunda rodada. A chave sai torta, mas ninguém deixa de ver o jogo.
    comChave([
      partida({
        id: 'q1', round: 1, orderInRound: 1, nextMatchId: 'semi-que-nao-veio',
        participantA: marcelo, participantAId: 'insc-3',
        participantB: caio, participantBId: 'insc-4',
      }),
      partida({ id: 'semi-1', round: 2, orderInRound: 1, nextMatchId: null }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText('Marcelo Vidal')).toBeInTheDocument()
    expect(screen.getByText('Caio Peçanha')).toBeInTheDocument()
  })
})

/**
 * A caixa de campeão — #292.
 *
 * Ela já existiu, alimentada por participante inventado, e saiu junto com a
 * simulação na #256. Voltou porque o dado passou a existir: a api#270 fez o
 * placar fechar a partida e gravar o vencedor.
 *
 * **O teste que importa aqui é o de quando ela NÃO aparece.** Coroar cedo é o
 * jeito de esta caixa reencenar a #256 — um lugar reservado na tela para um
 * campeão que ainda não existe é o começo de alguém preenchê-lo com qualquer
 * coisa.
 */
describe('TournamentBracket — o campeão da divisão', () => {
  const comChave = (partidas: TournamentMatch[]) => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })
    buscaPartidas.mockResolvedValue({ success: true, data: partidas })
  }

  /** A chave de 4 com a final em outro estado, e o resto igual. */
  const chaveComFinal = (over: Partial<TournamentMatch>): TournamentMatch[] => [
    CHAVE_DE_QUATRO[0],
    CHAVE_DE_QUATRO[1],
    { ...CHAVE_DE_QUATRO[2], ...over },
  ]

  const caixaDoCampeao = () => screen.queryByTestId('coluna-do-campeao')

  it('coroa quem a API gravou como vencedor da final', async () => {
    comChave(CHAVE_DE_QUATRO)

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const caixa = await screen.findByTestId('coluna-do-campeao')
    expect(within(caixa).getByText('Juliana Prado')).toBeInTheDocument()
    expect(within(caixa).getByText('Campeão')).toBeInTheDocument()
  })

  it('coroa no W.O. também: é vitória, mesmo sem placar', async () => {
    comChave(chaveComFinal({
      status: 'WALKOVER', scoreA: null, scoreB: null,
      winner: marcelo, winnerId: 'insc-3',
    }))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // Não há placar para comparar: o nome só pode ter saído do `winner`.
    const caixa = await screen.findByTestId('coluna-do-campeao')
    expect(within(caixa).getByText('Marcelo Vidal')).toBeInTheDocument()
  })

  it('chave de 2: a única rodada é a final, e ela coroa igual', async () => {
    comChave([
      partida({
        id: 'final-1', round: 1, orderInRound: 1, nextMatchId: null,
        participantA: juliana, participantAId: 'insc-1',
        participantB: aline, participantBId: 'insc-2',
        winner: aline, winnerId: 'insc-2',
        status: 'FINISHED', scoreA: 9, scoreB: 15,
      }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // Ler a final pelo `nextMatchId`, e não pela contagem de rodadas, é o que
    // faz este caso não precisar de nada especial.
    const caixa = await screen.findByTestId('coluna-do-campeao')
    expect(within(caixa).getByText('Aline Duarte')).toBeInTheDocument()
  })

  it.each(['PENDING', 'SCHEDULED', 'IN_PROGRESS'] as const)(
    'final em %s não desenha caixa nenhuma — nem vazia, nem "a definir"',
    async (status) => {
      comChave(chaveComFinal({ status, winner: null, winnerId: null, scoreA: null, scoreB: null }))

      renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

      await screen.findByText('Semifinal')
      expect(caixaDoCampeao()).not.toBeInTheDocument()
      expect(screen.queryByText('Campeão')).not.toBeInTheDocument()
    },
  )

  it('não coroa quando a final fechou e o vencedor não veio na resposta', async () => {
    // `winnerId` preenchido com `winner` nulo é resposta que a API não produz.
    // Se produzir, a caixa fica de fora: o nome sai de `winner.user.name` e de
    // mais lugar nenhum — nunca do lado que marcou mais, que aqui é o 15 x 9.
    comChave(chaveComFinal({ winner: null }))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText('Semifinal')
    expect(caixaDoCampeao()).not.toBeInTheDocument()
  })

  it('não coroa ninguém quando duas partidas não apontam para lugar nenhum', async () => {
    // Dado quebrado: a semifinal perdeu o destino e virou uma segunda candidata
    // a final. Coroar a vencedora dela seria anunciar a campeã de um torneio que
    // não acabou — e a semifinal é a primeira da lista, então "pega a primeira"
    // erraria exatamente aqui.
    comChave([{ ...CHAVE_DE_QUATRO[0], nextMatchId: null }, CHAVE_DE_QUATRO[1], CHAVE_DE_QUATRO[2]])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByText('Aline Duarte')
    expect(caixaDoCampeao()).not.toBeInTheDocument()
  })

  it('divisão sem chaveamento continua exatamente como estava', async () => {
    comChave([])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    expect(await screen.findByText(/ainda não foi gerado/)).toBeInTheDocument()
    expect(caixaDoCampeao()).not.toBeInTheDocument()
  })

  it('a coluna do campeão não é uma rodada, e a chave não escorrega por causa dela', async () => {
    comChave(CHAVE_DE_QUATRO)

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('coluna-do-campeao')

    // Duas rodadas, uma faixa em cada — exatamente o que a chave de 4 desenhava
    // antes da caixa existir. Ela entra fora dessa contagem, e por isso não
    // renomeia fase nenhuma nem mexe na altura de quem já estava lá.
    const rodadas = screen.getAllByTestId('rodada-da-chave')
    expect(rodadas).toHaveLength(2)
    expect(
      rodadas.map((r) => r.querySelectorAll('[data-testid="faixa-da-chave"]').length),
    ).toEqual([1, 1])
    expect(screen.queryByText(/Quartas/)).not.toBeInTheDocument()
  })
})

/**
 * A disputa de terceiro lugar — web#304, saindo da api#304.
 *
 * A partida de 3º tem `nextMatchId` nulo **como a final**, e é aí que ela
 * quebrava duas coisas de uma vez: a caixa de campeão sumia (a rede da #292
 * contra dado quebrado disparava contra dado legítimo) e a chave desalinhava.
 *
 * A correção é separá-la antes de montar o bracket. Por isso o teste mais
 * importante deste bloco não é o da caixa nova: são os dois que provam que a
 * chave e o campeão voltaram a se comportar como antes dela existir.
 */
describe('TournamentBracket — a disputa de terceiro lugar', () => {
  const comChave = (partidas: TournamentMatch[]) => {
    buscaDivisoes.mockResolvedValue({ success: true, data: [divisao()] })
    buscaPartidas.mockResolvedValue({ success: true, data: partidas })
  }

  const rita  = lado('insc-5', 'Rita Almeida')
  const tiago = lado('insc-6', 'Tiago Nunes')

  /**
   * A chave de 4 com disputa: as duas semis apontam o perdedor para `terceiro`,
   * que vive na rodada da final — exatamente como a api#304 gera.
   */
  const chaveComDisputa = (over: Partial<TournamentMatch> = {}): TournamentMatch[] => [
    { ...CHAVE_DE_QUATRO[0], loserNextMatchId: 'terceiro-1' },
    { ...CHAVE_DE_QUATRO[1], loserNextMatchId: 'terceiro-1' },
    CHAVE_DE_QUATRO[2],
    partida({
      id: 'terceiro-1', round: 2, orderInRound: 2, nextMatchId: null,
      participantA: aline, participantAId: 'insc-2',
      participantB: caio,  participantBId: 'insc-4',
      ...over,
    }),
  ]

  it('desenha a disputa fora da chave, com título próprio', async () => {
    comChave(chaveComDisputa())

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    const bloco = await screen.findByTestId('disputa-de-terceiro')
    expect(within(bloco).getByText('Disputa de 3º lugar')).toBeInTheDocument()
    expect(within(bloco).getByText('Aline Duarte')).toBeInTheDocument()
    expect(within(bloco).getByText('Caio Peçanha')).toBeInTheDocument()
  })

  it('o campeão volta a aparecer — era ele que sumia', async () => {
    comChave(chaveComDisputa())

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // Antes desta issue eram DUAS partidas sem destino, e a rede da #292 se
    // recusava a coroar. Com a disputa fora da lista, sobra só a final.
    const caixa = await screen.findByTestId('coluna-do-campeao')
    expect(within(caixa).getByText('Juliana Prado')).toBeInTheDocument()
  })

  it('a chave não ganha faixa vazia por causa dela', async () => {
    comChave(chaveComDisputa())

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('disputa-de-terceiro')

    // Duas rodadas com uma faixa cada, igual à chave de 4 sem disputa. Com a
    // partida de 3º dentro da última rodada, a primeira ganhava uma faixa vazia
    // que não correspondia a confronto nenhum, e a chave escorregava.
    const rodadas = screen.getAllByTestId('rodada-da-chave')
    expect(rodadas).toHaveLength(2)
    expect(
      rodadas.map((r) => r.querySelectorAll('[data-testid="faixa-da-chave"]').length),
    ).toEqual([1, 1])
  })

  it('a disputa não vira uma fase do torneio', async () => {
    comChave(chaveComDisputa())

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('disputa-de-terceiro')
    // A chave continua sendo semifinal e final. Contá-la como rodada faria a
    // conta de trás para frente rebatizar a final de "Semifinal".
    expect(screen.getByText('Semifinal')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.queryByText(/Quartas/)).not.toBeInTheDocument()
  })

  it('a disputa não aparece dentro do bracket', async () => {
    comChave(chaveComDisputa())

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('disputa-de-terceiro')

    // Três cartões dentro da chave — as duas semifinais e a final —, e não
    // quatro. Contar cartão é o que discrimina: os nomes da disputa também
    // aparecem nas semifinais que os dois perderam, então procurar por nome
    // passaria com a partida no lugar errado.
    const cartoes = screen
      .getAllByTestId('faixa-da-chave')
      .flatMap((faixa) => [...faixa.children])

    expect(cartoes).toHaveLength(3)
    expect(cartoes.some((c) => c.textContent?.includes('Disputa'))) .toBe(false)
  })

  it('divisão sem disputa continua exatamente como estava', async () => {
    comChave(CHAVE_DE_QUATRO)

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('coluna-do-campeao')
    expect(screen.queryByTestId('disputa-de-terceiro')).not.toBeInTheDocument()
  })

  it('a disputa ainda aberta aparece, e não coroa ninguém por engano', async () => {
    comChave(chaveComDisputa({ status: 'SCHEDULED', winner: null, winnerId: null }))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    // A final já fechou, então o campeão aparece mesmo com a disputa pendente —
    // são coisas diferentes, e a api encerra o campeonato só quando as duas
    // acabam.
    const caixa = await screen.findByTestId('coluna-do-campeao')
    expect(within(caixa).getByText('Juliana Prado')).toBeInTheDocument()
    expect(screen.getByTestId('disputa-de-terceiro')).toBeInTheDocument()
  })

  it('a rede contra dado quebrado continua de pé', async () => {
    // Três sem destino: a disputa sai da lista, e ainda sobram duas. Aí ninguém
    // é coroado — que é a regra da #292, e ela não pode ter sido afrouxada.
    comChave([
      { ...CHAVE_DE_QUATRO[0], nextMatchId: null, loserNextMatchId: 'terceiro-1' },
      { ...CHAVE_DE_QUATRO[1], loserNextMatchId: 'terceiro-1' },
      CHAVE_DE_QUATRO[2],
      partida({
        id: 'terceiro-1', round: 2, orderInRound: 2, nextMatchId: null,
        participantA: rita, participantAId: 'insc-5',
        participantB: tiago, participantBId: 'insc-6',
      }),
    ])

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" />)

    await screen.findByTestId('disputa-de-terceiro')
    expect(screen.queryByTestId('coluna-do-campeao')).not.toBeInTheDocument()
  })

  it('quem organiza lança o placar da disputa como lança o de qualquer partida', async () => {
    comChave(chaveComDisputa({ status: 'SCHEDULED', winner: null, winnerId: null }))

    renderWithProviders(<TournamentBracket tournamentId="torneio-1" podeLancar />)

    // A disputa segura o campeonato aberto até ser jogada: sem o botão aqui,
    // fechá-la exigiria sair do app.
    const bloco = await screen.findByTestId('disputa-de-terceiro')
    expect(within(bloco).getByRole('button', { name: 'Lançar placar' })).toBeInTheDocument()
  })
})
