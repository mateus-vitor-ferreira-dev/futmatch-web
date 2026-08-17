/**
 * O menu do owner reflete o plano assinado.
 *
 * O que ele **não** pode fazer é esconder o que o dono poderia comprar: menu que
 * some deixa a pessoa achando que o produto não faz aquilo, e ninguém troca de plano
 * por uma funcionalidade que nunca viu. Item não incluso fica visível, com cadeado,
 * e leva para a comparação de planos.
 */
import { describe, it, expect } from 'vitest'
import { ownerNavItems } from './navItems'
import type { PlanFeature } from '../types/api'

const abre = (...quais: PlanFeature[]) => (f: PlanFeature) => quais.includes(f)

const rotulos = (itens: ReturnType<typeof ownerNavItems>) => itens.map((i) => i.label)
const bloqueados = (itens: ReturnType<typeof ownerNavItems>) =>
  itens.filter((i) => i.bloqueado).map((i) => i.label)

describe('ownerNavItems — o que o plano abre', () => {
  it('plano de entrada: estoque e equipamento com cadeado', () => {
    const itens = ownerNavItems('OWNER', abre())

    expect(bloqueados(itens)).toEqual(['Estoque', 'Equipamentos'])
    // Continuam no menu — é assim que o dono descobre que existem.
    expect(rotulos(itens)).toContain('Estoque')
    expect(rotulos(itens)).toContain('Equipamentos')
  })

  it('plano do meio: estatísticas abertas, estoque e equipamento ainda não', () => {
    const itens = ownerNavItems('OWNER', abre('ESTATISTICAS'))

    expect(bloqueados(itens)).toEqual(['Estoque', 'Equipamentos'])
  })

  it('plano de cima: nada bloqueado', () => {
    const itens = ownerNavItems('OWNER', abre('ESTATISTICAS', 'EQUIPAMENTOS', 'ESTOQUE'))

    expect(bloqueados(itens)).toEqual([])
  })
})

describe('ownerNavItems — o que nunca é bloqueado', () => {
  it('a porta de entrada, o que já foi contratado e a forma de pagar', () => {
    const itens = ownerNavItems('OWNER', abre())

    // Solicitações é como o dono entra na plataforma, Meus Estabelecimentos é o que
    // ele contratou e Planos é como ele paga. Trancar qualquer um deixaria o cliente
    // do lado de fora da própria assinatura.
    for (const item of ['Solicitações', 'Meus Estabelecimentos', 'Planos', 'Visão Geral']) {
      expect(bloqueados(itens)).not.toContain(item)
    }
  })
})

describe('ownerNavItems — enquanto o plano não chegou', () => {
  it('não marca nada, em vez de piscar cadeado e tirar', () => {
    const itens = ownerNavItems('OWNER')

    expect(bloqueados(itens)).toEqual([])
  })
})

describe('ownerNavItems — ADMIN', () => {
  it('ganha o atalho do painel admin e nada de cadeado', () => {
    // Quem decide isso é o `useSubscription`, que devolve `temFuncionalidade`
    // sempre verdadeiro para ADMIN — aqui só se confirma que o menu respeita.
    const itens = ownerNavItems('ADMIN', () => true)

    expect(rotulos(itens)).toContain('Painel Admin')
    expect(bloqueados(itens)).toEqual([])
  })
})
