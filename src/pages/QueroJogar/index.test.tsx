/**
 * Fluxo crítico: encontrar uma partida para jogar.
 *
 * É a tela que entrega o valor central do produto. Filtro que não filtra faz o
 * jogador desistir achando que não existe partida — e o pior é que a tela não
 * dá nenhum sinal de que quebrou: ela mostra uma lista, só que a errada.
 *
 * Dois tipos de filtro convivem aqui, e a diferença importa:
 *  - modalidade e cidade são SERVER-SIDE — mudam disparam nova busca na API
 *  - horário, preço, arena e texto são CLIENT-SIDE — recortam o que já veio
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaPartida, criaParticipante, criaUsuario, criaBuscaDePartidas, envelope, erroDaApi } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import { Routes, Route, Link } from 'react-router-dom'
import QueroJogar from './index'

/**
 * Espião sobre o `useNavigate`, e não substituto dele.
 *
 * Afirmar para onde o botão de voltar leva exige ver a chamada — o destino não
 * deixa rastro na tela quando é `-1`. Mas trocar o hook por um `vi.fn()` puro
 * quebraria o `<Link>` do router, que também navega por ele, e é o `Link` que
 * empilha a segunda entrada de que o teste do "volta uma página" depende.
 *
 * Então o espião registra e **repassa**: a navegação acontece de verdade.
 */
const navegar = vi.fn()
vi.mock('react-router-dom', async (original) => {
  const real = await original<typeof import('react-router-dom')>()
  return {
    ...real,
    useNavigate: () => {
      const navegarDeVerdade = real.useNavigate()
      return (...args: Parameters<typeof navegarDeVerdade>) => {
        navegar(...args)
        return navegarDeVerdade(...(args as [never]))
      }
    },
  }
})

vi.mock('../../services/playerService')
vi.mock('../../services/auth')
vi.mock('../../services/sports')
vi.mock('../../services/notificationService')

import { playerService } from '../../services/playerService'
import * as authService from '../../services/auth'
import { getSports } from '../../services/sports'
import { notificationService } from '../../services/notificationService'

const buscaEventos = vi.mocked(playerService.searchEvents)
const entraNoJogo = vi.mocked(playerService.joinEvent)

const USUARIO = criaUsuario({ id: 'user-1', name: 'Mateus' })

beforeEach(() => {
  vi.clearAllMocks()
  marcarSessao()
  vi.mocked(authService.getMe).mockResolvedValue(envelope(USUARIO))
  // O hook useSports cai no catálogo local quando a API não responde — é o
  // caminho que o teste quer, e evita depender da lista vinda do servidor.
  vi.mocked(getSports).mockRejectedValue(erroDaApi('sem sports', 503))
  vi.mocked(notificationService.list).mockResolvedValue([])
  entraNoJogo.mockResolvedValue(envelope({ userId: 'user-1' } as never))
})

/** Aguarda a primeira busca terminar e a contagem de resultados aparecer. */
async function esperaResultados() {
  await waitFor(() => {
    expect(screen.queryByText('Buscando partidas...')).not.toBeInTheDocument()
  })
}

/** Acha um `<select>` pelo texto de uma das suas opções. */
function selectComOpcao(textoDaOpcao: string): HTMLSelectElement {
  return screen.getByRole('option', { name: textoDaOpcao }).closest('select')!
}

/**
 * Card da partida na grade, ou null.
 *
 * Procura pelo `<h3>` de propósito, e não pelo texto solto: o nome da arena
 * também aparece como `<option>` no filtro de estabelecimento, montado a
 * partir da lista completa. Afirmar por texto daria o card como presente
 * mesmo depois de ele sumir da grade.
 */
function cardDaArena(nome: string): HTMLElement | null {
  return screen.queryByRole('heading', { name: nome })
}

describe('QueroJogar — listagem', () => {
  it('mostra as partidas que a API devolveu', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({ id: 'p1', court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } } }),
        criaPartida({ id: 'p2', court: { ...criaPartida().court!, place: { id: 'l2', name: 'Quadra do Zé', city: 'Lavras', neighborhood: 'Jardim', state: 'MG' } } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    expect(cardDaArena('Arena Sul')).toBeInTheDocument()
    expect(cardDaArena('Quadra do Zé')).toBeInTheDocument()
    expect(screen.getByText('2 partidas encontradas')).toBeInTheDocument()
  })

  it('concorda no singular quando só há um resultado', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('1 partida encontrada')).toBeInTheDocument()
  })

  it('não quebra quando a busca falha — mostra lista vazia', async () => {
    buscaEventos.mockRejectedValue(erroDaApi('API fora do ar', 500))

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('0 partidas encontradas')).toBeInTheDocument()
  })
})

describe('QueroJogar — filtros que refazem a busca na API', () => {
  it('escolher modalidade refaz a busca com courtType', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    expect(buscaEventos).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'WAITING', page: 1 }),
    )
    expect(buscaEventos.mock.calls[0][0]).not.toHaveProperty('courtType')

    await user.selectOptions(selectComOpcao('👟 Futsal'), 'FUTSAL')

    await waitFor(() => {
      expect(buscaEventos).toHaveBeenLastCalledWith(
        expect.objectContaining({ courtType: 'FUTSAL', page: 1 }),
      )
    })
  })

  it('escolher cidade refaz a busca com city', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({ id: 'p1', court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } } }),
        criaPartida({ id: 'p2', court: { ...criaPartida().court!, place: { id: 'l2', name: 'Arena Norte', city: 'Três Corações', neighborhood: 'Centro', state: 'MG' } } }),
      ]),
    )
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.selectOptions(selectComOpcao('Todas as cidades'), 'Lavras')

    await waitFor(() => {
      expect(buscaEventos).toHaveBeenLastCalledWith(
        expect.objectContaining({ city: 'Lavras' }),
      )
    })
  })
})

describe('QueroJogar — filtros aplicados sobre o que já veio', () => {
  const MANHA = criaPartida({
    id: 'manha',
    date: '2027-03-11T09:00:00',
    court: { ...criaPartida().court!, place: { id: 'l1', name: 'Arena Manhã', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } },
  })
  const NOITE = criaPartida({
    id: 'noite',
    date: '2027-03-11T20:00:00',
    court: { ...criaPartida().court!, place: { id: 'l2', name: 'Arena Noite', city: 'Lavras', neighborhood: 'Jardim', state: 'MG' } },
  })

  it('o filtro de horário recorta a lista sem ir à API de novo', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    expect(cardDaArena('Arena Manhã')).toBeInTheDocument()
    expect(cardDaArena('Arena Noite')).toBeInTheDocument()
    const buscasAteAqui = buscaEventos.mock.calls.length

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('button', { name: /🌙 Noite/ }))

    await waitFor(() => {
      expect(cardDaArena('Arena Manhã')).not.toBeInTheDocument()
    })
    expect(cardDaArena('Arena Noite')).toBeInTheDocument()
    expect(screen.getByText('1 partida encontrada')).toBeInTheDocument()
    // Filtro client-side não pode custar uma ida à API.
    expect(buscaEventos).toHaveBeenCalledTimes(buscasAteAqui)
  })

  it('a busca por texto casa com nome do local e com bairro', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    await user.type(screen.getByPlaceholderText(/pesquisar por local ou bairro/i), 'jardim')

    await waitFor(() => {
      expect(cardDaArena('Arena Manhã')).not.toBeInTheDocument()
    })
    expect(cardDaArena('Arena Noite')).toBeInTheDocument()
  })

  it('o contador de filtros ativos reflete quantos estão ligados', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    const botaoFiltros = screen.getByRole('button', { name: /filtros/i })
    expect(within(botaoFiltros).queryByText('1')).not.toBeInTheDocument()

    await user.click(botaoFiltros)
    await user.click(screen.getByRole('button', { name: /🌙 Noite/ }))

    expect(await within(botaoFiltros).findByText('1')).toBeInTheDocument()
  })

  it('limpar filtros devolve a lista inteira', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('button', { name: /🌙 Noite/ }))
    await waitFor(() => expect(screen.getByText('1 partida encontrada')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    expect(await screen.findByText('2 partidas encontradas')).toBeInTheDocument()
  })
})

describe('QueroJogar — entrar na partida', () => {
  it('bloqueia o botão e avisa quando a partida está lotada', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({ maxPlayers: 4, _count: { participations: 4 } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    const botao = await screen.findByRole('button', { name: 'Partida lotada' })
    expect(botao).toBeDisabled()
    expect(screen.getByText('0 vagas restantes')).toBeInTheDocument()
  })

  it('mostra "Você entrou" e bloqueia quando o usuário já participa', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({
          maxPlayers: 10,
          participations: [criaParticipante({ userId: 'user-1' })],
          _count: { participations: 1 },
        }),
      ]),
    )

    renderWithProviders(<QueroJogar />)

    const botao = await screen.findByRole('button', { name: /você entrou/i })
    expect(botao).toBeDisabled()
  })

  it('entrar chama a API com quadra e evento, e recarrega a lista', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({ id: 'partida-9', courtId: 'quadra-7', maxPlayers: 10, _count: { participations: 3 } }),
      ]),
    )
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()
    const buscasAntes = buscaEventos.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Entrar na partida' }))

    await waitFor(() => {
      expect(entraNoJogo).toHaveBeenCalledWith('quadra-7', 'partida-9')
    })
    // Recarregar é o que faz a contagem de vagas subir na tela.
    await waitFor(() => {
      expect(buscaEventos.mock.calls.length).toBeGreaterThan(buscasAntes)
    })
  })

  it('a contagem de vagas na tela vem do que a API devolve', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePartidas([
        criaPartida({ maxPlayers: 10, _count: { participations: 7 } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('7 / 10 confirmados')).toBeInTheDocument()
    expect(screen.getByText('3 vagas restantes')).toBeInTheDocument()
  })
})

describe('QueroJogar — voltar', () => {
  it('volta uma página quando há para onde voltar dentro do app', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    // A pilha precisa ser empilhada de verdade: `initialEntries` com duas rotas
    // não serve, porque a entrada atual continua sendo a inicial da sessão e o
    // router dá `key: 'default'` a ela do mesmo jeito. Só um PUSH cria a chave
    // nova que o componente usa para decidir.
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/home" element={<Link to="/quero-jogar">Ir para Quero Jogar</Link>} />
        <Route path="/quero-jogar" element={<QueroJogar />} />
      </Routes>,
      { route: '/home' },
    )

    await user.click(screen.getByText('Ir para Quero Jogar'))
    await esperaResultados()

    await user.click(screen.getByRole('button', { name: /Voltar/ }))
    expect(navegar).toHaveBeenLastCalledWith(-1)
    // E voltou de fato: a tela anterior está de novo na frente.
    expect(await screen.findByText('Ir para Quero Jogar')).toBeInTheDocument()
  })

  it('vai para a home quando esta é a primeira tela da sessão', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    // Uma entrada só: a pessoa abriu a URL direto ou recarregou. Um `-1` daqui
    // sairia do Só+1, e um "Voltar" que fecha o produto não é voltar.
    const { user } = renderWithProviders(<QueroJogar />, { route: '/quero-jogar' })
    await esperaResultados()

    await user.click(screen.getByRole('button', { name: /Voltar/ }))
    expect(navegar).toHaveBeenCalledWith('/home')
  })
})

/**
 * O filtro por distância (#224).
 *
 * O teste que carrega esta issue é o de que **os três parâmetros andam juntos**:
 * a api recusa `radiusKm` sem origem com 422, e não ignora. Um front que
 * mandasse só o raio veria a busca inteira voltar com cara de ter respeitado o
 * filtro — e a pessoa concluiria que não há nada perto quando há.
 */
describe('QueroJogar — filtro por distância', () => {
  /** O navegador de mentira: concede na hora, com coordenadas de Lavras. */
  function comLocalizacao() {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: -21.24, longitude: -44.99 } } as GeolocationPosition),
      },
    })
  }

  function semLocalizacao() {
    Object.defineProperty(globalThis.navigator, 'geolocation', { configurable: true, value: undefined })
  }

  const abreFiltros = async (user: ReturnType<typeof renderWithProviders>['user']) => {
    await user.click(screen.getByRole('button', { name: /Filtros/ }))
  }

  it('sem origem, os raios ficam desabilitados e a tela explica por quê', async () => {
    semLocalizacao()
    vi.mocked(authService.getMe).mockResolvedValue(envelope(USUARIO))
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()
    await abreFiltros(user)

    // Desabilitado com explicação, e não escondido: sumir faria parecer que o
    // filtro não existe, e a pessoa não saberia que dá para tê-lo.
    expect(screen.getByRole('button', { name: '10 km' })).toBeDisabled()
    expect(screen.getByText(/Precisamos saber de onde você sai/)).toBeInTheDocument()
  })

  it('com origem, escolher o raio manda origem e raio juntos', async () => {
    comLocalizacao()
    localStorage.setItem('so-mais-um:localizacao', 'concedida')
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()
    await abreFiltros(user)

    await user.click(await screen.findByRole('button', { name: '10 km' }))

    await waitFor(() =>
      expect(buscaEventos).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: -21.24, longitude: -44.99, radiusKm: 10 }),
      ),
    )
  })

  it('mostra a distância de cada resultado quando a busca tem raio', async () => {
    comLocalizacao()
    localStorage.setItem('so-mais-um:localizacao', 'concedida')
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([{ ...criaPartida(), distanceKm: 3.2 } as never]))

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    expect(await screen.findByText('3.2 km')).toBeInTheDocument()
  })

  it('a busca textual não mostra distância nenhuma', async () => {
    semLocalizacao()
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    // Sem origem não há distância a mostrar, e um "—" seria ruído em toda
    // busca textual.
    expect(screen.queryByText(/ km$/)).not.toBeInTheDocument()
  })

  it('"Qualquer" desliga o raio e a busca volta a ser sem origem', async () => {
    comLocalizacao()
    localStorage.setItem('so-mais-um:localizacao', 'concedida')
    buscaEventos.mockResolvedValue(criaBuscaDePartidas([criaPartida()]))

    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()
    await abreFiltros(user)
    await user.click(await screen.findByRole('button', { name: '25 km' }))
    await waitFor(() => expect(buscaEventos).toHaveBeenCalledWith(expect.objectContaining({ radiusKm: 25 })))

    await user.click(screen.getByRole('button', { name: 'Qualquer' }))

    await waitFor(() => {
      const ultima = buscaEventos.mock.calls.at(-1)?.[0]
      // Os três somem juntos: raio sem origem é 422, e origem sem raio não
      // filtra nada.
      expect(ultima).not.toHaveProperty('radiusKm')
      expect(ultima).not.toHaveProperty('latitude')
    })
  })
})
