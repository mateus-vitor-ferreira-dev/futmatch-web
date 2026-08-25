/**
 * As regras da pelada, antes de qualquer clique.
 *
 * Requisito que só aparece como erro depois do clique é uma armadilha: o
 * jogador se anima, clica, toma recusa e não sabe se é regra, defeito ou
 * implicância com ele. É contra isso que a #230 existe.
 *
 * Dois testes carregam mais peso:
 *
 * 1. **Partida sem requisito não renderiza nada.** A esmagadora maioria continua
 *    sem regra, e o caso comum não pode ganhar enfeite por causa do raro.
 * 2. **Sem veredito, a barra ainda aparece.** É o visitante deslogado: a
 *    consulta ao portão exige sessão, e sem os requisitos vindo no corpo da
 *    pelada (api#332) ele não veria regra nenhuma.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import type { EntryVerdict, PartidaRequirement } from '../../types/api'
import RequisitosDaPartida, { EtiquetaDeRequisitos } from './index'

const presenca: PartidaRequirement = { type: 'MIN_ATTENDANCE_RATE', params: { min: 0.8 } }
const jogos: PartidaRequirement = { type: 'MIN_MATCHES_PLAYED', params: { min: 10 } }
const nota: PartidaRequirement = { type: 'MIN_AVERAGE_RATING', params: { min: 4.5 } }

const veredito = (over: Partial<EntryVerdict> = {}): EntryVerdict => ({
  allowed: false,
  failures: [],
  requirements: [],
  ...over,
})

describe('RequisitosDaPartida', () => {
  it('não renderiza nada quando a pelada não tem requisito', () => {
    const { container } = renderWithProviders(<RequisitosDaPartida requirements={[]} />)

    // O caso comum fica exatamente como estava antes desta issue.
    expect(container).toBeEmptyDOMElement()
  })

  it('escreve a regra por extenso, traduzindo a fração em porcentagem', () => {
    renderWithProviders(<RequisitosDaPartida requirements={[presenca]} />)

    // O `params.min` é fração de 0 a 1 porque a API recusa porcentagem — `1`
    // seria ambíguo. Quem traduz para o número que se lê é a tela.
    expect(screen.getByText('Presença mínima de 80%')).toBeInTheDocument()
  })

  it('mostra a barra mesmo sem veredito — é o visitante deslogado', () => {
    renderWithProviders(<RequisitosDaPartida requirements={[jogos]} veredito={null} />)

    expect(screen.getByText('Ter jogado ao menos 10 partidas')).toBeInTheDocument()
    // Sem sessão não há o que dizer sobre este jogador, e a tela não inventa.
    expect(screen.queryByText(/você atende/)).not.toBeInTheDocument()
    expect(screen.queryByText(/você não atende/)).not.toBeInTheDocument()
  })

  it('diz o que o jogador ATENDE, e não só o que falta', () => {
    renderWithProviders(
      <RequisitosDaPartida
        requirements={[presenca, jogos]}
        veredito={veredito({
          requirements: [
            { type: 'MIN_ATTENDANCE_RATE', params: { min: 0.8 }, met: true },
            {
              type: 'MIN_MATCHES_PLAYED',
              params: { min: 10 },
              met: false,
              failure: { code: 'REQUIREMENT_MIN_MATCHES_PLAYED', message: '...', numeros: { exigido: 10, atual: 3 } },
            },
          ],
        })}
      />,
    )

    // O estado vai no TEXTO, e não só na cor e no símbolo: leitor de tela não
    // lê cor, e o ✓ sozinho vira "marca de seleção" sem contexto.
    expect(screen.getByText(/— você atende/)).toBeInTheDocument()
    expect(screen.getByText(/— você não atende/)).toBeInTheDocument()
  })

  it('diz quantas peladas faltam, a partir do número e não da frase', () => {
    renderWithProviders(
      <RequisitosDaPartida
        requirements={[jogos]}
        veredito={veredito({
          requirements: [
            {
              type: 'MIN_MATCHES_PLAYED',
              params: { min: 10 },
              met: false,
              // A `message` está de propósito com um texto que NÃO contém "7":
              // se a tela estivesse fazendo parse dela, este teste falharia.
              failure: {
                code: 'REQUIREMENT_MIN_MATCHES_PLAYED',
                message: 'texto qualquer da API',
                numeros: { exigido: 10, atual: 3 },
              },
            },
          ],
        })}
      />,
    )

    expect(screen.getByText('Faltam 7 partidas para você alcançar.')).toBeInTheDocument()
  })

  it('singular quando falta uma só', () => {
    renderWithProviders(
      <RequisitosDaPartida
        requirements={[{ type: 'MIN_MATCHES_PLAYED', params: { min: 4 } }]}
        veredito={veredito({
          requirements: [
            {
              type: 'MIN_MATCHES_PLAYED',
              params: { min: 4 },
              met: false,
              failure: { code: 'x', message: 'y', numeros: { exigido: 4, atual: 3 } },
            },
          ],
        })}
      />,
    )

    expect(screen.getByText('Falta 1 partida para você alcançar.')).toBeInTheDocument()
  })

  it('presença e nota dizem onde a pessoa está, sem virar conta', () => {
    renderWithProviders(
      <RequisitosDaPartida
        requirements={[presenca, nota]}
        veredito={veredito({
          requirements: [
            {
              type: 'MIN_ATTENDANCE_RATE',
              params: { min: 0.8 },
              met: false,
              failure: { code: 'a', message: 'b', numeros: { exigido: 0.8, atual: 0.5 } },
            },
            {
              type: 'MIN_AVERAGE_RATING',
              params: { min: 4.5 },
              met: false,
              failure: { code: 'c', message: 'd', numeros: { exigido: 4.5, atual: 3.2 } },
            },
          ],
        })}
      />,
    )

    // "Faltam 30%" soaria como conta, não como caminho: presença e nota
    // dependem de COMO a pessoa joga, e não de quantas vezes.
    expect(screen.getByText('A sua está em 50%.')).toBeInTheDocument()
    expect(screen.getByText('A sua está em 3.2.')).toBeInTheDocument()
    expect(screen.queryByText(/Faltam/)).not.toBeInTheDocument()
  })

  it('requisito sem resultado no veredito fica neutro, e não é dado como falho', () => {
    renderWithProviders(
      <RequisitosDaPartida
        requirements={[presenca]}
        // É o caso do organizador: `requirements` vem vazio porque ele não se
        // submete aos próprios requisitos. Marcar tudo como falho ali seria
        // mentira; marcar como atendido também.
        veredito={veredito({ allowed: true, requirements: [] })}
      />,
    )

    expect(screen.getByText('Presença mínima de 80%')).toBeInTheDocument()
    expect(screen.queryByText(/— você não atende/)).not.toBeInTheDocument()
  })
})

describe('EtiquetaDeRequisitos', () => {
  it('não aparece quando não há requisito', () => {
    const { container } = renderWithProviders(<EtiquetaDeRequisitos requirements={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('conta os requisitos, no plural e no singular', () => {
    const { unmount } = renderWithProviders(<EtiquetaDeRequisitos requirements={[presenca, jogos]} />)
    expect(screen.getByText(/2 requisitos para entrar/)).toBeInTheDocument()
    unmount()

    renderWithProviders(<EtiquetaDeRequisitos requirements={[presenca]} />)
    expect(screen.getByText(/1 requisito para entrar/)).toBeInTheDocument()
  })
})
