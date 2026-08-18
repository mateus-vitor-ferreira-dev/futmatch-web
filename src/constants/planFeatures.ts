import type { PlanFeature } from '../types/api'

/**
 * Como cada funcionalidade da grade se chama para o dono.
 *
 * Num lugar só porque três telas dizem o mesmo nome — o painel, a comparação de
 * planos e o portão que barra quem não tem. Três cópias divergiriam, e a divergência
 * apareceria justamente onde o dono está decidindo pagar mais.
 *
 * O rótulo é o nome do item no menu do painel, de propósito: quem lê "Estoque" na
 * comparação precisa reconhecer a mesma palavra quando o item aparecer no menu.
 */
export const ROTULOS_DE_FUNCIONALIDADE: Record<PlanFeature, string> = {
  ESTATISTICAS: 'Estatísticas do espaço',
  EQUIPAMENTOS: 'Controle de equipamento',
  ESTOQUE: 'Controle de estoque',
}

/**
 * O que **todo** plano inclui, inclusive o de entrada.
 *
 * Não é funcionalidade da grade: é o que o dono contrata ao assinar qualquer degrau.
 * Existe porque uma lista feita só de `funcionalidades` faria o Básico parecer um
 * plano vazio, quando ele é o plano de entrada — e um cartão de plano vazio não vende
 * nada nem descreve o produto.
 */
export const INCLUSO_EM_TODO_PLANO = [
  'Cadastrar a arena e as quadras',
  'Receber e administrar as partidas',
]

/** Ordem de exibição — do que abre antes, no degrau mais barato, para o que abre depois. */
export const ORDEM_DAS_FUNCIONALIDADES: PlanFeature[] = ['ESTATISTICAS', 'EQUIPAMENTOS', 'ESTOQUE']
