/**
 * Exemplo de teste de função pura — o formato mais barato que existe:
 * sem DOM, sem provider, sem async. Função que não renderiza nada se testa
 * assim, direto.
 */
import { describe, it, expect } from 'vitest'
import { formatPhoneBR } from './masks'

describe('formatPhoneBR', () => {
  it('formata celular de 11 dígitos como (XX) XXXXX-XXXX', () => {
    expect(formatPhoneBR('11987654321')).toBe('(11) 98765-4321')
  })

  it('formata fixo de 10 dígitos como (XX) XXXX-XXXX', () => {
    expect(formatPhoneBR('1133334444')).toBe('(11) 3333-4444')
  })

  it('descarta o que não é dígito', () => {
    expect(formatPhoneBR('(11) 9 8765-4321')).toBe('(11) 98765-4321')
  })

  it('formata parcialmente enquanto o usuário ainda está digitando', () => {
    expect(formatPhoneBR('11')).toBe('(11')
    expect(formatPhoneBR('1198')).toBe('(11) 98')
    expect(formatPhoneBR('119876543')).toBe('(11) 9876-543')
  })

  it('corta o excedente em 11 dígitos', () => {
    expect(formatPhoneBR('11987654321999')).toBe('(11) 98765-4321')
  })

  it.each([
    ['string vazia', ''],
    ['null', null],
    ['undefined', undefined],
  ])('devolve string vazia para %s', (_caso, entrada) => {
    expect(formatPhoneBR(entrada)).toBe('')
  })
})
