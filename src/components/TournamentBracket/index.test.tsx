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
import { screen, waitFor } from '@testing-library/react'
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

    expect(await screen.findAllByText('Juliana Prado')).toHaveLength(2) // semifinal e final
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
    expect(screen.getByText('Juliana Prado')).toHaveStyle({ color: lightTheme.colors.primaryDark })
    expect(screen.getByText('Marcelo Vidal')).not.toHaveStyle({ color: lightTheme.colors.primaryDark })
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
    expect(screen.getByText('Juliana Prado')).toHaveStyle({ color: lightTheme.colors.primaryDark })
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
