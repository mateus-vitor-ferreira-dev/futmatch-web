/**
 * `mensagemDeErro` decide o que o usuário lê quando algo falha. É chamada em
 * dez pontos das páginas, e cada um deles depende dela para não mostrar
 * "[object Object]" ou um stack trace no lugar de uma frase.
 */
import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { mensagemDeErro } from './apiError'
import { erroDaApi } from '../test/factories'

describe('mensagemDeErro', () => {
  it('prefere a mensagem que a API mandou no corpo', () => {
    expect(mensagemDeErro(erroDaApi('Você já está nesta pelada'))).toBe(
      'Você já está nesta pelada',
    )
  })

  it('cai na mensagem do próprio AxiosError quando o corpo não traz nenhuma', () => {
    // Rede fora do ar: não há resposta, então não há corpo para ler.
    const semResposta = new AxiosError('Network Error')

    expect(mensagemDeErro(semResposta)).toBe('Network Error')
  })

  it('usa a mensagem de um Error comum', () => {
    expect(mensagemDeErro(new Error('quebrou aqui'))).toBe('quebrou aqui')
  })

  it('usa o padrão quando o Error vem sem mensagem', () => {
    expect(mensagemDeErro(new Error(''), 'Erro ao criar pelada.')).toBe(
      'Erro ao criar pelada.',
    )
  })

  it.each([
    ['string solta', 'algo'],
    ['objeto qualquer', { foo: 1 }],
    ['null', null],
    ['undefined', undefined],
  ])('usa o padrão para %s — em catch o valor é unknown', (_caso, lancado) => {
    expect(mensagemDeErro(lancado, 'Padrão')).toBe('Padrão')
  })

  it('tem um padrão próprio quando quem chama não informa nenhum', () => {
    expect(mensagemDeErro(null)).toBe('Algo deu errado. Tente novamente.')
  })
})
