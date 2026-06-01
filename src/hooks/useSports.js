import { useState, useEffect } from 'react'
import { getSports } from '../services/sports'

/**
 * Espelha o enum CourtType do Prisma.
 * Usado como fallback quando a API estiver offline ou indisponível.
 */
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

/**
 * Busca a lista de modalidades esportivas da API.
 * Aplica o fallback local se a requisição falhar (sem conexão, API offline etc.).
 *
 * @returns {{ sports: Array<{ id: string, label: string, icon: string }>, loading: boolean }}
 */
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
