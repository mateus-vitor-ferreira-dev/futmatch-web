import api from './api'
import type { ApiEnvelope, InventoryMovement, InventoryMovementReason, InventoryMovementType, InventoryProduct, InventoryUnit } from '../types/api'

export interface ProductInput {
  nome: string
  unidade: InventoryUnit
  precoVendaCentavos: number
  estoqueMinimo: number
  quantidadeAtual: number
}

export interface MovementInput {
  tipo: InventoryMovementType
  motivo: InventoryMovementReason
  quantidade: number
  observacao?: string | null
}

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data

export const inventoryService = {
  listProducts: (placeId: string) => api.get<ApiEnvelope<InventoryProduct[]>>(`/places/${placeId}/inventory/products`).then(unwrap),
  createProduct: (placeId: string, data: ProductInput) => api.post<ApiEnvelope<InventoryProduct>>(`/places/${placeId}/inventory/products`, data).then(unwrap),
  updateProduct: (placeId: string, productId: string, data: Partial<Omit<ProductInput, 'quantidadeAtual'>>) => api.patch<ApiEnvelope<InventoryProduct>>(`/places/${placeId}/inventory/products/${productId}`, data).then(unwrap),
  listMovements: (placeId: string, productId?: string) => api.get<ApiEnvelope<InventoryMovement[]>>(`/places/${placeId}/inventory/movements`, { params: { productId } }).then(unwrap),
  createMovement: (placeId: string, productId: string, data: MovementInput) => api.post<ApiEnvelope<InventoryMovement>>(`/places/${placeId}/inventory/products/${productId}/movements`, data).then(unwrap),
}
