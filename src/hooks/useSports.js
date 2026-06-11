import { useState, useEffect } from 'react'
import { getSports } from '../services/sports'

const FALLBACK_SPORTS = [
  { id: 'SOCIETY',      label: 'Society',         icon: '⚽', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'CAMPO',        label: 'Futebol de Campo', icon: '🏟️', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'FUTSAL',       label: 'Futsal',           icon: '👟', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: '⚽', groupOrder: 1 },
  { id: 'AREIA',        label: 'Futevôlei',        icon: '🏖️', group: 'FUTEVOLEI',    groupLabel: 'Futevôlei',    groupIcon: '🏖️', groupOrder: 2 },
  { id: 'VOLEI',        label: 'Vôlei',            icon: '🏐', group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: '🏐', groupOrder: 3 },
  { id: 'VOLEI_AREIA',  label: 'Vôlei de Areia',   icon: '🌊', group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: '🏐', groupOrder: 3 },
  { id: 'HANDBALL',     label: 'Handebol',         icon: '🤾', group: 'HANDBALL',     groupLabel: 'Handebol',     groupIcon: '🤾', groupOrder: 4 },
  { id: 'PETECA',       label: 'Peteca',           icon: '🏸', group: 'PETECA',       groupLabel: 'Peteca',       groupIcon: '🏸', groupOrder: 5 },
  { id: 'BEACH_TENNIS', label: 'Beach Tennis',     icon: '🎾', group: 'BEACH_TENNIS', groupLabel: 'Beach Tennis', groupIcon: '🎾', groupOrder: 6 },
  { id: 'BASQUETE',     label: 'Basquete',         icon: '🏀', group: 'BASQUETE',     groupLabel: 'Basquete',     groupIcon: '🏀', groupOrder: 7 },
  { id: 'TENIS',        label: 'Tênis',            icon: '🎾', group: 'TENIS',        groupLabel: 'Tênis',        groupIcon: '🎾', groupOrder: 8 },
  { id: 'POKER',        label: 'Poker',            icon: '🃏', group: 'POKER',        groupLabel: 'Poker',        groupIcon: '🃏', groupOrder: 9 },
]

function deriveTabs(sports) {
  const map = new Map()
  sports.forEach(sport => {
    if (!map.has(sport.group)) {
      map.set(sport.group, {
        id:    sport.group,
        label: sport.groupLabel,
        icon:  sport.groupIcon,
        order: sport.groupOrder ?? 99,
        types: [],
      })
    }
    map.get(sport.group).types.push(sport.id)
  })
  return [...map.values()].sort((a, b) => a.order - b.order)
}

/**
 * Busca modalidades da API e deriva tabs de filtro agrupadas por `group`.
 * Usa fallback local se a API estiver indisponível.
 *
 * @returns {{ sports: Sport[], tabs: Tab[], loading: boolean }}
 */
export function useSports() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSports()
      .then(setSports)
      .catch(() => setSports(FALLBACK_SPORTS))
      .finally(() => setLoading(false))
  }, [])

  const tabs = deriveTabs(sports.length ? sports : FALLBACK_SPORTS)

  return { sports, tabs, loading }
}
