import { useState, useEffect } from 'react'
import { getSports } from '../services/sports'
import type { CourtType, Sport } from '../types/api'

/**
 * Modalidade como este hook a manipula. O `description` é opcional porque o
 * fallback local não o traz — só a API devolve o campo completo.
 */
export type SportOption = Omit<Sport, 'description'> & { description?: string }

export interface SportTab {
  id: string
  label: string
  icon: string
  order: number
  types: CourtType[]
}

/**
 * ⚠️ A ordem aqui diverge da API: no backend TENIS é groupOrder 8 e POKER 9;
 * aqui é o inverso. Quando a API está indisponível e o fallback entra, os dois
 * tabs aparecem trocados em relação ao comportamento normal.
 */
const FALLBACK_SPORTS: SportOption[] = [
  { id: 'SOCIETY',      label: 'Society',         icon: '⚽', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'CAMPO',        label: 'Futebol de Campo', icon: '🏟️', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'FUTSAL',       label: 'Futsal',           icon: '👟', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'AREIA',        label: 'Futevôlei',        icon: '🟡', group: 'FUTEVOLEI',    groupLabel: 'Futevôlei',    groupIcon: '🟡', groupOrder: 2 },
  { id: 'VOLEI',        label: 'Vôlei',            icon: '🏐', group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: '🏐', groupOrder: 3 },
  { id: 'VOLEI_AREIA',  label: 'Vôlei de Areia',   icon: '🏖️', group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: '🏐', groupOrder: 3 },
  { id: 'HANDBALL',     label: 'Handebol',         icon: '🤾', group: 'HANDBALL',     groupLabel: 'Handebol',     groupIcon: '🤾', groupOrder: 4 },
  { id: 'PETECA',       label: 'Peteca',           icon: '🏸', group: 'PETECA',       groupLabel: 'Peteca',       groupIcon: '🏸', groupOrder: 5 },
  { id: 'BEACH_TENNIS', label: 'Beach Tennis',     icon: '🎾', group: 'BEACH_TENNIS', groupLabel: 'Beach Tennis', groupIcon: '🎾', groupOrder: 6 },
  { id: 'BASQUETE',     label: 'Basquete',         icon: '🏀', group: 'BASQUETE',     groupLabel: 'Basquete',     groupIcon: '🏀', groupOrder: 7 },
  { id: 'POKER',        label: 'Poker',            icon: '🃏', group: 'POKER',        groupLabel: 'Poker',        groupIcon: '🃏', groupOrder: 8 },
  { id: 'TENIS',        label: 'Tênis',            icon: '🎾', group: 'TENIS',        groupLabel: 'Tênis',        groupIcon: '🎾', groupOrder: 9 },
]

function deriveTabs(sports: SportOption[]): SportTab[] {
  const map = new Map<string, SportTab>()
  sports.filter(s => s.group).forEach(sport => {
    if (!map.has(sport.group)) {
      map.set(sport.group, {
        id:    sport.group,
        label: sport.groupLabel,
        icon:  sport.groupIcon,
        order: sport.groupOrder ?? 99,
        types: [],
      })
    }
    map.get(sport.group)!.types.push(sport.id)
  })
  return [...map.values()].sort((a, b) => a.order - b.order)
}

const SPORT_MAP: Partial<Record<CourtType, SportOption>> = Object.fromEntries(
  FALLBACK_SPORTS.map(s => [s.id, s]),
)

/** Retorna { label, icon } para um CourtType, sem precisar do hook. */
export function getSportMeta(type: CourtType): { label: string; icon: string } {
  return SPORT_MAP[type] ?? { label: type, icon: '⚽' }
}

/**
 * Busca modalidades da API e deriva tabs de filtro agrupadas por `group`.
 * Usa fallback local se a API estiver indisponível.
 *
 */
export function useSports(): { sports: SportOption[]; tabs: SportTab[]; loading: boolean } {
  const [sports, setSports] = useState<SportOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSports()
      .then(setSports)
      .catch(() => setSports(FALLBACK_SPORTS))
      .finally(() => setLoading(false))
  }, [])

  const safeSports = Array.isArray(sports) ? sports : []
  const effectiveSports = safeSports.length > 0 && safeSports.some(s => s.group) ? safeSports : FALLBACK_SPORTS
  const tabs = deriveTabs(effectiveSports)

  return { sports: effectiveSports, tabs, loading }
}
