import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AxiosRequestConfig } from 'axios'
import api from './api'
import { inventoryService } from './inventoryService'

const adapterOriginal = api.defaults.adapter

function captureRequests(data: unknown = { success: true, data: [] }) {
  const requests: AxiosRequestConfig[] = []
  api.defaults.adapter = async (config) => {
    requests.push(config)
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  return requests
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  api.defaults.adapter = adapterOriginal
})

describe('inventoryService', () => {
  it('envia o filtro de estoque baixo como query da API', async () => {
    const requests = captureRequests()

    await inventoryService.listProducts('place-1', true)

    expect(requests[0].url).toBe('/places/place-1/inventory/products')
    expect(requests[0].params).toEqual({ estoqueBaixo: true })
  })

  it('não envia o filtro quando todos os produtos devem ser listados', async () => {
    const requests = captureRequests()

    await inventoryService.listProducts('place-1')

    expect(requests[0].params).toBeUndefined()
  })

  it('exclui produto no endpoint aninhado do estabelecimento', async () => {
    const requests = captureRequests()

    await inventoryService.deleteProduct('place-1', 'product-1')

    expect(requests[0].method).toBe('delete')
    expect(requests[0].url).toBe('/places/place-1/inventory/products/product-1')
  })

  it('desativa produto por PATCH sem alterar o saldo', async () => {
    const requests = captureRequests({ success: true, data: {} })

    await inventoryService.updateProduct('place-1', 'product-1', { ativo: false })

    expect(requests[0].method).toBe('patch')
    expect(JSON.parse(requests[0].data as string)).toEqual({ ativo: false })
  })
})
