/**
 * A seção "partidas perto de você" (#223) e a origem da localização (#222).
 *
 * Dois testes carregam estas issues.
 *
 * O primeiro é o de que **o prompt do navegador não sai sozinho**. Permissão
 * pedida sem contexto é negada quase sempre, e navegador nenhum pergunta de
 * novo depois disso — é uma chance só, e perdê-la no primeiro carregamento
 * custaria a funcionalidade inteira para aquele jogador.
 *
 * O segundo é o de que **os dois vazios são diferentes**. Dizer "nada por
 * perto" para quem nunca informou onde mora é mentir sobre a cidade inteira; o
 * certo é convidar.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaPartida, criaUsuario, envelope } from '../../test/factories'
import { marcarSessao } from '../../services/api'
import * as eventsService from '../../services/events'
import * as authService from '../../services/auth'
import { notificationService } from '../../services/notificationService'
import { PartidasPerto } from './index'

vi.mock('../../services/events')
vi.mock('../../services/auth')
vi.mock('../../services/notificationService')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

const recomendadas = vi.mocked(eventsService.recommendedEvents)

const COORDENADAS = { latitude: -21.24, longitude: -44.99 }

/** O navegador de mentira. `getCurrentPosition` só responde se mandarmos. */
function geolocalizacao(desfecho: 'concede' | 'nega' | 'ausente') {
  if (desfecho === 'ausente') {
    Object.defineProperty(globalThis.navigator, 'geolocation', { value: undefined, configurable: true })
    return vi.fn()
  }
  const getCurrentPosition = vi.fn((ok: PositionCallback, erro?: PositionErrorCallback) => {
    if (desfecho === 'concede') ok({ coords: COORDENADAS } as GeolocationPosition)
    else erro?.({ code: 1, message: 'negado' } as GeolocationPositionError)
  })
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  })
  return getCurrentPosition
}

function comEndereco(latitude: number | null = null) {
  vi.mocked(authService.getMe).mockResolvedValue(
    envelope(
      criaUsuario({
        id: 'user-1',
        address: {
          zipCode: '37200-000',
          city: 'Lavras',
          state: 'MG',
          latitude,
          longitude: latitude === null ? null : -44.99,
        },
      }),
    ),
  )
}

const perto = (distanceKm: number) => ({ ...criaPartida(), distanceKm })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  marcarSessao()
  vi.mocked(notificationService.list).mockResolvedValue([])
  vi.mocked(authService.getMe).mockResolvedValue(envelope(criaUsuario({ id: 'user-1' })))
  recomendadas.mockResolvedValue(envelope({ events: [], origin: null, radiusKm: 10 }))
})

describe('PartidasPerto — sem origem', () => {
  it('não dispara o prompt do navegador sozinho', async () => {
    const getCurrentPosition = geolocalizacao('concede')

    renderWithProviders(<PartidasPerto />)
    await screen.findByText(/precisamos saber de onde você sai/i)

    // A chance é uma só: negado sem contexto, o navegador não pergunta de novo.
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('convida em vez de dizer que não há nada por perto', async () => {
    geolocalizacao('concede')

    renderWithProviders(<PartidasPerto />)

    expect(await screen.findByRole('button', { name: /Usar minha localização/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar meu endereço/ })).toBeInTheDocument()
    // Sem origem, nem vale gastar a viagem: a resposta seria NO_LOCATION.
    expect(recomendadas).not.toHaveBeenCalled()
  })

  it('o clique é que pede a permissão, e a resposta vira origem', async () => {
    const getCurrentPosition = geolocalizacao('concede')
    recomendadas.mockResolvedValue(envelope({ events: [perto(1.2)], origin: COORDENADAS, radiusKm: 10 }))

    const { user } = renderWithProviders(<PartidasPerto />)
    await user.click(await screen.findByRole('button', { name: /Usar minha localização/ }))

    expect(getCurrentPosition).toHaveBeenCalled()
    await waitFor(() =>
      expect(recomendadas).toHaveBeenCalledWith(expect.objectContaining({ latitude: -21.24 })),
    )
  })

  it('quem nega não vê erro alarmante, e continua podendo usar o endereço', async () => {
    geolocalizacao('nega')

    const { user } = renderWithProviders(<PartidasPerto />)
    await user.click(await screen.findByRole('button', { name: /Usar minha localização/ }))

    // Negar não é falha: é escolha legítima, e o app segue pelo endereço.
    expect(await screen.findByText(/Você não liberou a localização/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar meu endereço/ })).toBeInTheDocument()
  })

  it('a recusa é lembrada entre sessões', async () => {
    geolocalizacao('nega')
    const { user, unmount } = renderWithProviders(<PartidasPerto />)
    await user.click(await screen.findByRole('button', { name: /Usar minha localização/ }))
    await screen.findByText(/Você não liberou a localização/)
    unmount()

    geolocalizacao('concede')
    renderWithProviders(<PartidasPerto />)

    // Oferecer de novo a cada visita é insistir com quem já disse não.
    await screen.findByText(/Você não liberou a localização/)
    expect(screen.queryByRole('button', { name: /Usar minha localização/ })).not.toBeInTheDocument()
  })

  it('degrada com clareza onde o navegador não tem a API', async () => {
    geolocalizacao('ausente')

    renderWithProviders(<PartidasPerto />)

    expect(await screen.findByText(/navegador não informa localização/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Usar minha localização/ })).not.toBeInTheDocument()
  })
})

describe('PartidasPerto — com origem', () => {
  it('usa o endereço salvo quando não há localização do navegador', async () => {
    geolocalizacao('nega')
    comEndereco(-21.24)
    recomendadas.mockResolvedValue(envelope({ events: [perto(3.4)], origin: COORDENADAS, radiusKm: 10 }))

    renderWithProviders(<PartidasPerto />)

    await waitFor(() => expect(recomendadas).toHaveBeenCalled())
    expect(await screen.findByText(/a partir do seu endereço/)).toBeInTheDocument()
  })

  it('mostra a distância de cada partida', async () => {
    geolocalizacao('nega')
    comEndereco(-21.24)
    recomendadas.mockResolvedValue(envelope({ events: [perto(2.7)], origin: COORDENADAS, radiusKm: 10 }))

    renderWithProviders(<PartidasPerto />)

    expect(await screen.findByText('2.7 km')).toBeInTheDocument()
  })

  it('nenhuma por perto sugere ampliar o raio, e amplia de verdade', async () => {
    geolocalizacao('nega')
    comEndereco(-21.24)

    const { user } = renderWithProviders(<PartidasPerto />)

    const ampliar = await screen.findByRole('button', { name: /Procurar em 25 km/ })
    await user.click(ampliar)

    // Vazio com origem conhecida é resposta legítima — o caminho é ampliar, e
    // não convidar de novo a informar de onde a pessoa sai.
    await waitFor(() =>
      expect(recomendadas).toHaveBeenCalledWith(expect.objectContaining({ radiusKm: 25 })),
    )
  })
})
