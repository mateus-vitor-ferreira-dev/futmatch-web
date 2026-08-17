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
import type { Sport } from '../../types/api'
import AuthLayout from './index'
import { WHEEL_ITEM_HEIGHT } from './styles'

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

/**
 * A #243: o cartão em foco media ~67 px dentro de um slot de 56 px e, ancorado
 * pelo topo, derramava o excedente por cima do rótulo do vizinho de baixo. Não
 * era intermitente — acontecia a cada 3 segundos, com toda modalidade que
 * entrava em foco, e era o primeiro elemento animado de quem chega para logar.
 *
 * jsdom não faz layout, então nada aqui mede pixel renderizado. O que estes
 * casos travam é a regra de onde a sobreposição nasceu: **a distância entre os
 * centros de dois cartões é a própria altura do cartão**, e essa altura é a
 * mesma para todos. Enquanto as duas coisas forem verdade, item nenhum alcança
 * o vizinho — e o dia em que alguém separar os dois números, ou deixar a altura
 * voltar a depender do conteúdo, quebra aqui e não em produção.
 */
function criaModalidade(over: Partial<Sport> & Pick<Sport, 'id' | 'label'>): Sport {
  return {
    icon: '⚽',
    description: 'Descrição curta',
    group: 'FUTEBOL',
    groupLabel: 'Futebol',
    groupIcon: '⚽',
    groupOrder: 1,
    ...over,
  } as Sport
}

/**
 * As descrições são o que distingue este dado do catálogo embutido no
 * `useSports`, que entra quando a API não responde e **não** traz o campo.
 * Sem elas, o `waitFor` casaria com o rótulo do fallback e o teste rodaria
 * contra uma lista que não é a que ele montou.
 */
function modalidades(descricao = (label: string) => `Descrição de ${label}`): Sport[] {
  return [
    { id: 'CAMPO',  label: 'Futebol de Campo' },
    { id: 'FUTSAL', label: 'Futsal' },
    { id: 'AREIA',  label: 'Futevôlei' },
    { id: 'VOLEI',  label: 'Vôlei' },
    { id: 'PETECA', label: 'Peteca' },
  ].map((m) => criaModalidade({ ...m, description: descricao(m.label) } as Partial<Sport> & Pick<Sport, 'id' | 'label'>))
}

/** Renderiza e só devolve quando a roda já está montada com o dado da API. */
async function renderizaRoda(lista: Sport[]) {
  buscaModalidades.mockResolvedValue(lista)
  const resultado = renderiza()
  await waitFor(() =>
    expect(screen.getByText(lista[0]!.description)).toBeInTheDocument(),
  )
  return resultado
}

/**
 * Os cartões da roda são os únicos elementos com `top` no style inline — é por
 * ele que o componente posiciona cada um dentro da trilha.
 *
 * A propriedade é lida do `style`, e não casada como texto do atributo: o
 * seletor `[style*="top:"]` também pega o `margin-top` do `HeadlineDesc`.
 */
function cartoesDaRoda(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[style]')]
    .filter((el) => el.style.top !== '')
}

describe('<AuthLayout /> — roda de modalidades', () => {
  beforeEach(() => {
    buscaNumeros.mockResolvedValue(NUMEROS)
  })

  it('todo cartão tem a mesma altura, e ela é a distância entre dois vizinhos', async () => {
    const { container } = await renderizaRoda(modalidades())

    const cartoes = cartoesDaRoda(container)
    expect(cartoes.length).toBeGreaterThan(1)

    for (const cartao of cartoes) {
      expect(getComputedStyle(cartao).height).toBe(`${WHEEL_ITEM_HEIGHT}px`)
    }

    // Centros consecutivos separados por exatamente uma altura de cartão: é o
    // que garante que a folga seja zero e nunca negativa.
    const centros = cartoes.map((c) => parseFloat(c.style.top)).sort((a, b) => a - b)
    for (let i = 1; i < centros.length; i++) {
      expect(centros[i]! - centros[i - 1]!).toBe(WHEEL_ITEM_HEIGHT)
    }
  })

  it('o cartão é ancorado pelo centro, não pelo topo', async () => {
    const { container } = await renderizaRoda(modalidades())

    // Sem o translateY(-50%), a sobra de altura cai inteira para baixo — que é
    // exatamente como o cartão de cima passava por cima do de baixo.
    for (const cartao of cartoesDaRoda(container)) {
      expect(cartao.style.transform).toMatch(/^translateY\(-50%\) scale\(/)
    }
  })

  it('a descrição é renderizada em todos os itens, e não só no que está em foco', async () => {
    const { container } = await renderizaRoda(modalidades())

    // É a linha da descrição que iguala a altura: renderizada só no ativo, ela
    // fazia o cartão em foco medir uma linha a mais que os vizinhos.
    const comDescricao = cartoesDaRoda(container).filter((cartao) =>
      /Descrição de/.test(cartao.textContent ?? ''),
    )
    expect(comDescricao).toHaveLength(cartoesDaRoda(container).length)
  })

  it('descrição longa não devolve a altura ao conteúdo', async () => {
    // O texto vem da API: uma descrição que quebrasse em duas linhas
    // reintroduziria a diferença de altura que a #243 fechou.
    const { container } = await renderizaRoda(
      modalidades((label) => `Descrição de ${label}, ${'desproporcionalmente longa '.repeat(8).trim()}`),
    )

    for (const cartao of cartoesDaRoda(container)) {
      expect(getComputedStyle(cartao).height).toBe(`${WHEEL_ITEM_HEIGHT}px`)
    }
  })
})
