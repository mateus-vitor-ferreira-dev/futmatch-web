import api from './api'
import type {
  CourtType,
  Equipment,
  EquipmentBorrower,
  EquipmentCondition,
  EquipmentLoan,
  EquipmentPartida,
  EquipmentSettlementType,
} from '../types/api'

export interface EquipmentInput {
  nome: string
  modalidade: CourtType | null
  quantidadeTotal: number
  estado: EquipmentCondition
}

export interface EquipmentLoanInput {
  equipmentId: string
  borrowerId: string
  matchId?: string | null
  quantidade: number
  observacao?: string | null
}

export interface EquipmentSettlementInput {
  tipo: EquipmentSettlementType
  quantidade: number
  observacao?: string | null
}

export const listItems = async (placeId: string): Promise<Equipment[]> =>
  (await api.get(`/places/${placeId}/equipment/items`)).data.data

export const createItem = async (placeId: string, data: EquipmentInput): Promise<Equipment> =>
  (await api.post(`/places/${placeId}/equipment/items`, data)).data.data

export const updateItem = async (
  placeId: string,
  equipmentId: string,
  data: Partial<Omit<EquipmentInput, 'quantidadeTotal'>>,
): Promise<Equipment> =>
  (await api.patch(`/places/${placeId}/equipment/items/${equipmentId}`, data)).data.data

export const listLoans = async (placeId: string, status: 'pending' | 'all' = 'pending'): Promise<EquipmentLoan[]> =>
  (await api.get(`/places/${placeId}/equipment/loans`, { params: { status } })).data.data

export const createLoan = async (placeId: string, data: EquipmentLoanInput): Promise<EquipmentLoan> =>
  (await api.post(`/places/${placeId}/equipment/loans`, data)).data.data

export const settleLoan = async (placeId: string, loanId: string, data: EquipmentSettlementInput) =>
  (await api.post(`/places/${placeId}/equipment/loans/${loanId}/settlements`, data)).data.data

export const searchBorrowers = async (placeId: string, search = ''): Promise<EquipmentBorrower[]> =>
  (await api.get(`/places/${placeId}/equipment/borrowers`, { params: { search } })).data.data

export const listPartidas = async (placeId: string): Promise<EquipmentPartida[]> =>
  (await api.get(`/places/${placeId}/equipment/events`)).data.data
