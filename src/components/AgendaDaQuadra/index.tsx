import { faixaDeHorario } from '../../utils/agenda'
import type { OcupacaoDaQuadra } from '../../types/api'
import { Bloco, Titulo, Lista, Item, Faixa, Descricao, Vazio, Aviso } from './styles'

/**
 * O que já ocupa a quadra no dia escolhido (api#443, web#368).
 *
 * ## O que ela mostra, e o que não mostra
 *
 * A lista do **dia**, e não da semana: a tela de criar partida já pede quadra,
 * data, hora, duração, vagas, valor, Pix e regras de acesso, e uma semana de
 * marcações ali dentro compete com a única coisa que a pessoa está decidindo.
 *
 * Cada linha traz horário e descrição, e a descrição é a que a api entregou —
 * `partida de Fulano`, `2ª rodada, jogo 3`, ou `horário reservado` quando a
 * partida é `LINK` ou `PRIVATE`. **A tela não sabe de quem é uma marcação
 * reservada, e é assim de propósito:** quem esconde é a api, para o mesmo
 * segredo não depender de cada tela lembrar de guardá-lo.
 *
 * ## Por que a lista aparece mesmo sem conflito
 *
 * Ela não é uma mensagem de erro: é o que faltava para escolher. Mostrá-la só
 * quando dá conflito devolveria a pessoa ao "tente de novo até acertar" — que é
 * exatamente o que esta issue veio tirar.
 */

export interface AgendaDaQuadraProps {
  ocupacoes: OcupacaoDaQuadra[]
  carregando: boolean
  /** A agenda não pôde ser lida — a tela diz que não conferiu, e não que está livre. */
  erro: boolean
  /** A ocupação que cruza o horário escolhido agora, quando há uma. */
  conflito: OcupacaoDaQuadra | null
  /** `false` enquanto não há data escolhida: não há dia sobre o que falar. */
  temData: boolean
}

export function AgendaDaQuadra({
  ocupacoes,
  carregando,
  erro,
  conflito,
  temData,
}: AgendaDaQuadraProps) {
  if (!temData) {
    return (
      <Bloco>
        <Titulo>Agenda da quadra</Titulo>
        <Vazio>Escolha a data para ver o que já está marcado.</Vazio>
      </Bloco>
    )
  }

  return (
    <Bloco>
      <Titulo>Agenda da quadra neste dia</Titulo>

      {carregando && <Vazio>Consultando a agenda...</Vazio>}

      {/*
        Erro NÃO vira silêncio, ao contrário da estimativa de alcance.
        Uma agenda que não carregou é a tela deixando de barrar horário
        ocupado — e deixar a lista vazia diria "a quadra está livre", que é
        a única coisa que ela não pode afirmar aqui.
      */}
      {erro && (
        <Aviso $tom="atencao">
          <span aria-hidden="true">⚠️</span>
          <span>
            Não foi possível carregar a agenda. Você pode criar assim mesmo — se
            o horário estiver ocupado, o servidor vai avisar.
          </span>
        </Aviso>
      )}

      {!carregando && !erro && ocupacoes.length === 0 && (
        <Vazio>Nada marcado neste dia. A quadra está livre.</Vazio>
      )}

      {ocupacoes.length > 0 && (
        <Lista>
          {ocupacoes.map((ocupacao, i) => {
            const atropela = conflito != null && conflito.inicio === ocupacao.inicio
            return (
              // A chave inclui o índice porque `id` é `null` em toda marcação
              // reservada — duas delas no mesmo dia colidiriam numa chave só.
              <Item key={`${ocupacao.inicio}-${ocupacao.id ?? i}`} $atropela={atropela}>
                <Faixa>{faixaDeHorario(ocupacao)}</Faixa>
                <Descricao>{ocupacao.descricao}</Descricao>
              </Item>
            )
          })}
        </Lista>
      )}

      {conflito && (
        <Aviso $tom="erro" role="alert">
          <span aria-hidden="true">⛔</span>
          <span>
            O horário escolhido cruza com {conflito.descricao},{' '}
            {faixaDeHorario(conflito)}. Escolha outro horário ou outra quadra.
          </span>
        </Aviso>
      )}
    </Bloco>
  )
}
