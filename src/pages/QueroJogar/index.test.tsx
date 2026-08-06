/**
 * Fluxo crítico: encontrar uma pelada para jogar.
 *
 * É a tela que entrega o valor central do produto. Filtro que não filtra faz o
 * jogador desistir achando que não existe pelada — e o pior é que a tela não
 * dá nenhum sinal de que quebrou: ela mostra uma lista, só que a errada.
 *
 * Dois tipos de filtro convivem aqui, e a diferença importa:
 *  - modalidade e cidade são SERVER-SIDE — mudam disparam nova busca na API
 *  - horário, preço, arena e texto são CLIENT-SIDE — recortam o que já veio
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { criaPelada, criaParticipante, criaUsuario, criaBuscaDePeladas, envelope, erroDaApi } from '../../test/factories'
import { TOKEN_KEY } from '../../services/api'
import QueroJogar from './index'

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
  localStorage.setItem(TOKEN_KEY, 'token-valido')
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
    expect(screen.queryByText('Buscando jogos...')).not.toBeInTheDocument()
  })
}

/** Acha um `<select>` pelo texto de uma das suas opções. */
function selectComOpcao(textoDaOpcao: string): HTMLSelectElement {
  return screen.getByRole('option', { name: textoDaOpcao }).closest('select')!
}

/**
 * Card da pelada na grade, ou null.
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
  it('mostra as peladas que a API devolveu', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePeladas([
        criaPelada({ id: 'p1', court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } } }),
        criaPelada({ id: 'p2', court: { ...criaPelada().court!, place: { id: 'l2', name: 'Quadra do Zé', city: 'Lavras', neighborhood: 'Jardim', state: 'MG' } } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    expect(cardDaArena('Arena Sul')).toBeInTheDocument()
    expect(cardDaArena('Quadra do Zé')).toBeInTheDocument()
    expect(screen.getByText('2 jogos encontrados')).toBeInTheDocument()
  })

  it('concorda no singular quando só há um resultado', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([criaPelada()]))

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('1 jogo encontrado')).toBeInTheDocument()
  })

  it('não quebra quando a busca falha — mostra lista vazia', async () => {
    buscaEventos.mockRejectedValue(erroDaApi('API fora do ar', 500))

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('0 jogos encontrados')).toBeInTheDocument()
  })
})

describe('QueroJogar — filtros que refazem a busca na API', () => {
  it('escolher modalidade refaz a busca com courtType', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([criaPelada()]))
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
      criaBuscaDePeladas([
        criaPelada({ id: 'p1', court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } } }),
        criaPelada({ id: 'p2', court: { ...criaPelada().court!, place: { id: 'l2', name: 'Arena Norte', city: 'Três Corações', neighborhood: 'Centro', state: 'MG' } } }),
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
  const MANHA = criaPelada({
    id: 'manha',
    date: '2027-03-11T09:00:00',
    court: { ...criaPelada().court!, place: { id: 'l1', name: 'Arena Manhã', city: 'Lavras', neighborhood: 'Centro', state: 'MG' } },
  })
  const NOITE = criaPelada({
    id: 'noite',
    date: '2027-03-11T20:00:00',
    court: { ...criaPelada().court!, place: { id: 'l2', name: 'Arena Noite', city: 'Lavras', neighborhood: 'Jardim', state: 'MG' } },
  })

  it('o filtro de horário recorta a lista sem ir à API de novo', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([MANHA, NOITE]))
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
    expect(screen.getByText('1 jogo encontrado')).toBeInTheDocument()
    // Filtro client-side não pode custar uma ida à API.
    expect(buscaEventos).toHaveBeenCalledTimes(buscasAteAqui)
  })

  it('a busca por texto casa com nome do local e com bairro', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    await user.type(screen.getByPlaceholderText(/pesquisar por local ou bairro/i), 'jardim')

    await waitFor(() => {
      expect(cardDaArena('Arena Manhã')).not.toBeInTheDocument()
    })
    expect(cardDaArena('Arena Noite')).toBeInTheDocument()
  })

  it('o contador de filtros ativos reflete quantos estão ligados', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    const botaoFiltros = screen.getByRole('button', { name: /filtros/i })
    expect(within(botaoFiltros).queryByText('1')).not.toBeInTheDocument()

    await user.click(botaoFiltros)
    await user.click(screen.getByRole('button', { name: /🌙 Noite/ }))

    expect(await within(botaoFiltros).findByText('1')).toBeInTheDocument()
  })

  it('limpar filtros devolve a lista inteira', async () => {
    buscaEventos.mockResolvedValue(criaBuscaDePeladas([MANHA, NOITE]))
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('button', { name: /🌙 Noite/ }))
    await waitFor(() => expect(screen.getByText('1 jogo encontrado')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    expect(await screen.findByText('2 jogos encontrados')).toBeInTheDocument()
  })
})

describe('QueroJogar — entrar no jogo', () => {
  it('bloqueia o botão e avisa quando a pelada está lotada', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePeladas([
        criaPelada({ maxPlayers: 4, _count: { participations: 4 } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)
    await esperaResultados()

    const botao = await screen.findByRole('button', { name: 'Jogo lotado' })
    expect(botao).toBeDisabled()
    expect(screen.getByText('0 vagas restantes')).toBeInTheDocument()
  })

  it('mostra "Você entrou" e bloqueia quando o usuário já participa', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePeladas([
        criaPelada({
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
      criaBuscaDePeladas([
        criaPelada({ id: 'pelada-9', courtId: 'quadra-7', maxPlayers: 10, _count: { participations: 3 } }),
      ]),
    )
    const { user } = renderWithProviders(<QueroJogar />)
    await esperaResultados()
    const buscasAntes = buscaEventos.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Entrar no jogo' }))

    await waitFor(() => {
      expect(entraNoJogo).toHaveBeenCalledWith('quadra-7', 'pelada-9')
    })
    // Recarregar é o que faz a contagem de vagas subir na tela.
    await waitFor(() => {
      expect(buscaEventos.mock.calls.length).toBeGreaterThan(buscasAntes)
    })
  })

  it('a contagem de vagas na tela vem do que a API devolve', async () => {
    buscaEventos.mockResolvedValue(
      criaBuscaDePeladas([
        criaPelada({ maxPlayers: 10, _count: { participations: 7 } }),
      ]),
    )

    renderWithProviders(<QueroJogar />)

    expect(await screen.findByText('7 / 10 confirmados')).toBeInTheDocument()
    expect(screen.getByText('3 vagas restantes')).toBeInTheDocument()
  })
})
