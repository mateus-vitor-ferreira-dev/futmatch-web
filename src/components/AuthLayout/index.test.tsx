/**
 * Os números do painel esquerdo são afirmação pública sobre tração, feita em
 * produção às quatro rotas de autenticação e à raiz. Até a #234 eram
 * constantes escritas no código — "847 jogadores online" contra 2 no banco.
 *
 * O que este teste protege é a regra que substituiu isso: número na tela vem
 * do banco, e cartão que não sustenta a afirmação que faz não aparece — nunca
 * um zero, nunca um valor inventado, nunca um número que prova o contrário.
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

/** Base confortavelmente acima de todos os limiares — ver LIMIARES no index. */
const NUMEROS = { jogadores: 128, peladasAbertas: 9, cidades: 4, arenas: 26 }

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
    buscaNumeros.mockResolvedValue(NUMEROS)

    renderiza()

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument())
    expect(screen.getByText('jogadores na plataforma')).toBeInTheDocument()
    expect(screen.getByText('peladas abertas')).toBeInTheDocument()
    // "online" e "hoje" prometiam presença e recorte de dia, que a rota não
    // tem. O rótulo agora diz o que o número de fato é.
    expect(screen.queryByText('jogadores online')).not.toBeInTheDocument()
    expect(screen.queryByText('jogos hoje')).not.toBeInTheDocument()
  })

  it('nunca exibe os números fixos que estavam em produção', async () => {
    buscaNumeros.mockResolvedValue(NUMEROS)

    renderiza()

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument())
    expect(screen.queryByText('847')).not.toBeInTheDocument()
    expect(screen.queryByText('32')).not.toBeInTheDocument()
  })

  it('cabem três cartões: o dado enche a linha e os fixos ficam de fora', async () => {
    buscaNumeros.mockResolvedValue(NUMEROS)

    renderiza()

    await waitFor(() => expect(screen.getByText('128')).toBeInTheDocument())
    expect(screen.getByText('peladas abertas')).toBeInTheDocument()
    expect(screen.getByText('arenas parceiras')).toBeInTheDocument()
    // Quarto do dado e os fixos não cabem — a linha tem três lugares.
    expect(screen.queryByText('cidades atendidas')).not.toBeInTheDocument()
    expect(screen.queryByText('modalidades')).not.toBeInTheDocument()
  })

  it('com a API fora do ar, sobram só os fatos de produto', async () => {
    buscaNumeros.mockRejectedValue(erroDaApi('fora do ar', 503))

    renderiza()

    await waitFor(() => expect(screen.getByText('modalidades')).toBeInTheDocument())
    expect(screen.getByText('gratuito para jogadores')).toBeInTheDocument()
    expect(screen.queryByText('jogadores na plataforma')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

/**
 * Os limiares vieram da `landing#36` e valem nas duas telas: esconder só o
 * zero deixava passar "2 jogadores na plataforma", que é verdade e prova o
 * contrário do que a linha se propõe a dizer.
 */
describe('<AuthLayout /> — limiar por cartão', () => {
  it('esconde o cartão do número que não sustenta a afirmação', async () => {
    // 49 jogadores é mais que zero e ainda assim não é prova social.
    buscaNumeros.mockResolvedValue({ ...NUMEROS, jogadores: 49 })

    renderiza()

    await waitFor(() => expect(screen.getByText('peladas abertas')).toBeInTheDocument())
    expect(screen.queryByText('jogadores na plataforma')).not.toBeInTheDocument()
    expect(screen.queryByText('49')).not.toBeInTheDocument()
  })

  it('o número igual ao limiar entra — o corte é "abaixo", não "até"', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 50, peladasAbertas: 5, cidades: 3, arenas: 3 })

    renderiza()

    await waitFor(() => expect(screen.getByText('50')).toBeInTheDocument())
    expect(screen.getByText('jogadores na plataforma')).toBeInTheDocument()
    expect(screen.getByText('peladas abertas')).toBeInTheDocument()
  })

  it('cada cartão tem o seu limiar: 4 cidades passa, 4 jogadores não', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 4, peladasAbertas: 0, cidades: 4, arenas: 0 })

    renderiza()

    await waitFor(() => expect(screen.getByText('cidades atendidas')).toBeInTheDocument())
    expect(screen.queryByText('jogadores na plataforma')).not.toBeInTheDocument()
  })

  it('com o dado que a produção devolve hoje, a linha fica só com os fatos de produto', async () => {
    buscaNumeros.mockResolvedValue({ jogadores: 2, peladasAbertas: 0, cidades: 0, arenas: 0 })

    renderiza()

    await waitFor(() => expect(screen.getByText('modalidades')).toBeInTheDocument())
    expect(screen.getByText('gratuito para jogadores')).toBeInTheDocument()
    expect(screen.queryByText('jogadores na plataforma')).not.toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
