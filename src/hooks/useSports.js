import { useState, useEffect } from 'react'
import { getSports } from '../services/sports'

// Espelha o enum CourtType do Prisma — usado como fallback quando a API estiver offline
const FALLBACK_SPORTS = [
  { id: 'SOCIETY',      label: 'Society',         icon: '⚽' },
  { id: 'CAMPO',        label: 'Futebol de Campo', icon: '🏟️' },
  { id: 'FUTSAL',       label: 'Futsal',           icon: '👟' },
  { id: 'AREIA',        label: 'Futevôlei',        icon: '🏖️' },
  { id: 'VOLEI',        label: 'Vôlei',            icon: '🏐' },
  { id: 'VOLEI_AREIA',  label: 'Vôlei de Areia',   icon: '🌊' },
  { id: 'HANDBALL',     label: 'Handebol',         icon: '🤾' },
  { id: 'PETECA',       label: 'Peteca',           icon: '🏸' },
  { id: 'BEACH_TENNIS', label: 'Beach Tennis',     icon: '🎾' },
  { id: 'BASQUETE',     label: 'Basquete',         icon: '🏀' },
  { id: 'TENIS',        label: 'Tênis',            icon: '🎾' },
]

export function useSports() {
  const [sports, setSports]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSports()
      .then(setSports)
      .catch(() => setSports(FALLBACK_SPORTS))
      .finally(() => setLoading(false))
  }, [])

  return { sports, loading }
}
