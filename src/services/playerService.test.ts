/**
 * Testes da camada de serviço do jogador.
 *
 * Aqui o que se verifica é o CONTRATO com a API: método, caminho e onde cada
 * coisa vai. É a fronteira em que um erro não aparece na tela — a requisição
 * sai errada e a API responde 4xx sem que nada no front acuse o motivo.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import api from './api'
import { playerService } from './playerService'

const adapterOriginal = api.defaults.adapter

/** Captura a config da requisição e responde com o corpo pedido. */
function capturaRequisicao(resposta: unknown = { success: true, data: {} }) {
  const chamadas: AxiosRequestConfig[] = []
  api.defaults.adapter = async (config) => {
    chamadas.push(config)
    return { data: resposta, status: 200, statusText: 'OK', headers: {}, config }
  }
  return chamadas
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  api.defaults.adapter = adapterOriginal
})

describe('joinEvent', () => {
  it('faz POST no caminho aninhado de participações', async () => {
    const chamadas = capturaRequisicao()

    await playerService.joinEvent('quadra-7', 'pelada-9')

    expect(chamadas[0].method).toBe('post')
    expect(chamadas[0].url).toBe('/courts/quadra-7/events/pelada-9/participations')
  })

  it('devolve o envelope, não a resposta bruta do axios', async () => {
    capturaRequisicao({ success: true, data: { userId: 'user-1' } })

    const res = await playerService.joinEvent('quadra-7', 'pelada-9')

    expect(res).toEqual({ success: true, data: { userId: 'user-1' } })
  })
})

describe('leaveEvent', () => {
  it('faz DELETE no mesmo caminho do POST de entrar', async () => {
    const chamadas = capturaRequisicao()

    await playerService.leaveEvent('quadra-7', 'pelada-9')

    expect(chamadas[0].method).toBe('delete')
    expect(chamadas[0].url).toBe('/courts/quadra-7/events/pelada-9/participations')
  })

  /**
   * O DELETE do axios NÃO recebe corpo como segundo argumento, ao contrário do
   * post e do patch — ele vai em `config.data`. Escrito do jeito errado, a
   * requisição sai sem corpo nenhum e o motivo some em silêncio: a API não
   * reclama, porque `reason` é opcional.
   */
  it('manda o motivo no corpo da requisição', async () => {
    const chamadas = capturaRequisicao()

    await playerService.leaveEvent('quadra-7', 'pelada-9', 'me machuquei')

    expect(JSON.parse(chamadas[0].data as string)).toEqual({ reason: 'me machuquei' })
  })

  it('sem motivo, manda corpo vazio em vez de reason indefinido', async () => {
    const chamadas = capturaRequisicao()

    await playerService.leaveEvent('quadra-7', 'pelada-9')

    expect(JSON.parse(chamadas[0].data as string)).toEqual({})
  })
})

describe('searchEvents', () => {
  it('repassa os filtros como query string', async () => {
    const chamadas = capturaRequisicao()

    await playerService.searchEvents({ status: 'WAITING', courtType: 'FUTSAL', page: 2 })

    expect(chamadas[0].url).toBe('/events')
    expect(chamadas[0].params).toEqual({ status: 'WAITING', courtType: 'FUTSAL', page: 2 })
  })
})

describe('getEvent', () => {
  it('busca pelo id do evento, sem precisar da quadra', async () => {
    const chamadas = capturaRequisicao()

    await playerService.getEvent('pelada-9')

    expect(chamadas[0].url).toBe('/events/pelada-9')
  })
})

describe('updateEventStatus', () => {
  it('faz PATCH com o status no corpo', async () => {
    const chamadas = capturaRequisicao()

    await playerService.updateEventStatus('quadra-7', 'pelada-9', 'FINISHED')

    expect(chamadas[0].method).toBe('patch')
    expect(chamadas[0].url).toBe('/courts/quadra-7/events/pelada-9/status')
    expect(JSON.parse(chamadas[0].data as string)).toEqual({ status: 'FINISHED' })
  })
})
