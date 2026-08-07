import api from './api'
import type { ApiEnvelope, InventoryMovement, InventoryMovementReason, InventoryMovementType, InventoryProduct, InventoryUnit } from '../types/api'

export interface ProductInput {
  nome: string
  unidade: InventoryUnit
  precoVendaCentavos: number
  estoqueMinimo: number
  quantidadeAtual: number
}

export type ProductUpdateInput = Partial<Omit<ProductInput, 'quantidadeAtual'>> & {
  ativo?: boolean
}

export interface MovementInput {
  tipo: InventoryMovementType
  motivo: InventoryMovementReason
  quantidade: number
  observacao?: string | null
}

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data

export const inventoryService = {
  listProducts: (placeId: string, estoqueBaixo?: boolean) => api.get<ApiEnvelope<InventoryProduct[]>>(
    `/places/${placeId}/inventory/products`,
    { params: estoqueBaixo ? { estoqueBaixo: true } : undefined },
  ).then(unwrap),
  createProduct: (placeId: string, data: ProductInput) => api.post<ApiEnvelope<InventoryProduct>>(`/places/${placeId}/inventory/products`, data).then(unwrap),
  updateProduct: (placeId: string, productId: string, data: ProductUpdateInput) => api.patch<ApiEnvelope<InventoryProduct>>(`/places/${placeId}/inventory/products/${productId}`, data).then(unwrap),
  deleteProduct: (placeId: string, productId: string) => api.delete(`/places/${placeId}/inventory/products/${productId}`).then(() => undefined),
  listMovements: (placeId: string, productId?: string) => api.get<ApiEnvelope<InventoryMovement[]>>(`/places/${placeId}/inventory/movements`, { params: { productId } }).then(unwrap),
  createMovement: (placeId: string, productId: string, data: MovementInput) => api.post<ApiEnvelope<InventoryMovement>>(`/places/${placeId}/inventory/products/${productId}/movements`, data).then(unwrap),
}
