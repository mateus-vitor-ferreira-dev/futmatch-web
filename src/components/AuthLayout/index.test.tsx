/**
 * Os números do painel esquerdo são afirmação pública sobre tração, feita em
 * produção às quatro rotas de autenticação e à raiz. Até a #234 eram
 * constantes escritas no código — "847 jogadores online" contra 2 no banco.
 *
 * O que este teste protege é a regra que substituiu isso: número na tela vem
 * do banco, e cartão sem número que sustente a afirmação não aparece — nunca
 * um zero, nunca um valor inventado.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { erroDaApi } from '../../test/factories'
import AuthLayout from './index'

vi.mock('../../services/stats')
vi.mock('../../services/sports')
import { getPublicStats } from '../../services/stats'
import { getSports } from '../../services/sports'

const buscaNumeros = vi.mocked(getPublicStats)
const buscaModalidades = vi.mocked(getSports)

beforeEach(() => {
  vi.clearAllMocks()
  // A roda de modalidades não é o assunto aqui: o catálogo local do useSports
  // sustenta o componente sem que cada caso precise montá-lo.
  buscaModalidades.mockResolvedValue([])
})

function renderiza() {
  return renderWithProviders(<AuthLayout><p>formulário</p></AuthLayout>)
}

describe('<AuthLayout /> — números do painel', () => {
  it('mostra os números que a API devolveu, com o rótulo do dado que ela conta', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 2, peladasAbertas: 7, cidades: 3, arenas: 4 })

    renderiza()

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
    expect(screen.getByText('jogadores na plataforma')).toBeInTheDocument()
    expect(screen.getByText('peladas abertas')).toBeInTheDocument()
    // "online" e "hoje" prometiam presença e recorte de dia, que a rota não
    // tem. O rótulo agora diz o que o número de fato é.
    expect(screen.queryByText('jogadores online')).not.toBeInTheDocument()
    expect(screen.queryByText('jogos hoje')).not.toBeInTheDocument()
  })

  it('esconde o cartão do número zerado, em vez de exibir 0', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 2, peladasAbertas: 0, cidades: 0, arenas: 0 })

    renderiza()

    await waitFor(() => expect(screen.getByText('jogadores na plataforma')).toBeInTheDocument())
    expect(screen.queryByText('peladas abertas')).not.toBeInTheDocument()
    expect(screen.queryByText('cidades atendidas')).not.toBeInTheDocument()
    expect(screen.queryByText('arenas parceiras')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    // Os fatos de produto seguram a linha de pé sem inventar tração.
    expect(screen.getByText('modalidades')).toBeInTheDocument()
    expect(screen.getByText('gratuito para jogadores')).toBeInTheDocument()
  })

  it('com a API fora do ar, sobram só os fatos de produto', async () => {
    buscaNumeros.mockRejectedValue(erroDaApi('fora do ar', 503))

    renderiza()

    await waitFor(() => expect(screen.getByText('modalidades')).toBeInTheDocument())
    expect(screen.getByText('gratuito para jogadores')).toBeInTheDocument()
    expect(screen.queryByText('jogadores na plataforma')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('nunca exibe os números fixos que estavam em produção', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 2, peladasAbertas: 0, cidades: 0, arenas: 0 })

    renderiza()

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
    expect(screen.queryByText('847')).not.toBeInTheDocument()
    expect(screen.queryByText('32')).not.toBeInTheDocument()
  })

  it('cabem três cartões: o dado enche a linha e os fixos ficam de fora', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 40, peladasAbertas: 12, cidades: 5, arenas: 9 })

    renderiza()

    await waitFor(() => expect(screen.getByText('40')).toBeInTheDocument())
    expect(screen.getByText('peladas abertas')).toBeInTheDocument()
    expect(screen.getByText('arenas parceiras')).toBeInTheDocument()
    // Quarto do dado e os fixos não cabem — a linha tem três lugares.
    expect(screen.queryByText('cidades atendidas')).not.toBeInTheDocument()
    expect(screen.queryByText('modalidades')).not.toBeInTheDocument()
  })
})
