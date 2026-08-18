import type { CourtType } from '../types/api'

/**
 * Posições oferecidas em cada modalidade.
 *
 * A API guarda posição como **texto livre** (`String?`), e de propósito: goleiro,
 * levantador, líbero e pivô não cabem num enum só, e doze enums para um campo
 * que o sorteio lê como "é goleiro ou não" seria pior que texto. Quem oferece as
 * opções é o front — este arquivo — e é ele que impede o jogador de digitar
 * "goleirinho" e o sorteio não reconhecer.
 *
 * **`Goleiro` é escrito exatamente assim** nas quatro modalidades que têm um. É
 * a palavra que o sorteio equilibrado procura para não concentrar os goleiros no
 * mesmo time (api#206); mudar a grafia aqui desliga aquele comportamento sem
 * quebrar nada — o pior tipo de defeito.
 *
 * Modalidade fora deste mapa não pede posição: em pôquer, tênis e peteca a
 * pergunta não faz sentido, e um campo vazio pedindo resposta é pior que campo
 * nenhum.
 */
export const POSICOES_POR_MODALIDADE: Partial<Record<CourtType, readonly string[]>> = {
  SOCIETY: ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante'],
  CAMPO: ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'],
  FUTSAL: ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
  HANDBALL: ['Goleiro', 'Armador', 'Ponta', 'Pivô'],

  VOLEI: ['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero'],
  VOLEI_AREIA: ['Rede', 'Fundo'],
  AREIA: ['Esquerda', 'Direita'],

  BASQUETE: ['Armador', 'Ala', 'Ala-pivô', 'Pivô'],
  BEACH_TENNIS: ['Rede', 'Fundo'],
}

/** As opções da modalidade, ou lista vazia quando a pergunta não faz sentido nela. */
export function posicoesDe(modalidade: CourtType): readonly string[] {
  return POSICOES_POR_MODALIDADE[modalidade] ?? []
}

/**
 * Níveis, na ordem do `CompetitionLevel` da API.
 *
 * A ordem importa: é ela que o índice de nível usa para pontuar, e inverter dois
 * degraus aqui faria a tela discordar do cálculo — "meu nível subiu e meu índice
 * caiu".
 */
export const NIVEIS = [
  { id: 'BEGINNER', label: 'Iniciante', descricao: 'Estou começando agora' },
  { id: 'INTERMEDIATE', label: 'Intermediário', descricao: 'Jogo de vez em quando' },
  { id: 'AMATEUR', label: 'Amador', descricao: 'Jogo com frequência' },
  { id: 'ADVANCED', label: 'Avançado', descricao: 'Jogo bem, e sei disso' },
  { id: 'PROFESSIONAL', label: 'Profissional', descricao: 'Jogo ou já joguei em nível competitivo' },
] as const

export type NivelId = (typeof NIVEIS)[number]['id']

export const rotuloDoNivel = (id: string) => NIVEIS.find(n => n.id === id)?.label ?? id
