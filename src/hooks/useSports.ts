import { useQuery } from '@tanstack/react-query'
import { getSports } from '../services/sports'
import { chaves } from '../lib/queryClient'
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
  iconFallback: string | null
  order: number
  types: CourtType[]
}

/**
 * ⚠️ A ordem aqui diverge da API: no backend TENIS é groupOrder 8 e POKER 9;
 * aqui é o inverso. Quando a API está indisponível e o fallback entra, os dois
 * tabs aparecem trocados em relação ao comportamento normal.
 */
const FALLBACK_SPORTS: SportOption[] = [
  { id: 'SOCIETY',      label: 'Society',         icon: 'society',        iconFallback: '⚽', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: 'futebol',      groupIconFallback: '⚽', groupOrder: 1 },
  { id: 'CAMPO',        label: 'Futebol de Campo', icon: 'futebol-campo',  iconFallback: '🏟️', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: 'futebol',      groupIconFallback: '⚽', groupOrder: 1 },
  { id: 'FUTSAL',       label: 'Futsal',           icon: 'futsal',         iconFallback: '👟', group: 'FUTEBOL',      groupLabel: 'Futebol',      groupIcon: 'futebol',      groupIconFallback: '⚽', groupOrder: 1 },
  { id: 'AREIA',        label: 'Futevôlei',        icon: 'futevolei',      iconFallback: null, group: 'FUTEVOLEI',    groupLabel: 'Futevôlei',    groupIcon: 'futevolei',    groupIconFallback: null, groupOrder: 2 },
  { id: 'VOLEI',        label: 'Vôlei',            icon: 'volei',          iconFallback: '🏐', group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: 'volei',        groupIconFallback: '🏐', groupOrder: 3 },
  { id: 'VOLEI_AREIA',  label: 'Vôlei de Areia',   icon: 'volei-areia',    iconFallback: null, group: 'VOLEI',        groupLabel: 'Vôlei',        groupIcon: 'volei',        groupIconFallback: '🏐', groupOrder: 3 },
  { id: 'HANDBALL',     label: 'Handebol',         icon: 'handebol',       iconFallback: '🤾', group: 'HANDBALL',     groupLabel: 'Handebol',     groupIcon: 'handebol',     groupIconFallback: '🤾', groupOrder: 4 },
  { id: 'PETECA',       label: 'Peteca',           icon: 'peteca',         iconFallback: null, group: 'PETECA',       groupLabel: 'Peteca',       groupIcon: 'peteca',       groupIconFallback: null, groupOrder: 5 },
  { id: 'BEACH_TENNIS', label: 'Beach Tennis',     icon: 'beach-tennis',   iconFallback: '🎾', group: 'BEACH_TENNIS', groupLabel: 'Beach Tennis', groupIcon: 'beach-tennis', groupIconFallback: '🎾', groupOrder: 6 },
  { id: 'BASQUETE',     label: 'Basquete',         icon: 'basquete',       iconFallback: '🏀', group: 'BASQUETE',     groupLabel: 'Basquete',     groupIcon: 'basquete',     groupIconFallback: '🏀', groupOrder: 7 },
  // 🥎 no tênis, e não a raquete do Beach Tennis: o cartão de campeonato mostra
  // só o ícone, e com o mesmo emoji nos dois a modalidade deixava de ser legível.
  // Precisa continuar igual ao `src/constants/sports.ts` da API — este fallback
  // só entra quando o `GET /sports` não responde, e é aí que a divergência
  // apareceria como "o ícone mudou sozinho".
  { id: 'TENIS',        label: 'Tênis',            icon: 'tenis',          iconFallback: '🥎', group: 'TENIS',        groupLabel: 'Tênis',        groupIcon: 'tenis',        groupIconFallback: '🥎', groupOrder: 8 },
  { id: 'POKER',        label: 'Poker',            icon: 'poker',          iconFallback: '🃏', group: 'POKER',        groupLabel: 'Poker',        groupIcon: 'poker',        groupIconFallback: '🃏', groupOrder: 9 },
]

function deriveTabs(sports: SportOption[]): SportTab[] {
  const map = new Map<string, SportTab>()
  sports.filter(s => s.group).forEach(sport => {
    if (!map.has(sport.group)) {
      map.set(sport.group, {
        id:    sport.group,
        label: sport.groupLabel,
        icon:  sport.groupIcon,
        iconFallback: sport.groupIconFallback,
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
export function getSportMeta(type: CourtType): Pick<SportOption, 'label' | 'icon' | 'iconFallback'> {
  return SPORT_MAP[type] ?? { label: type, icon: 'society', iconFallback: '⚽' }
}

/**
 * Busca modalidades da API e deriva tabs de filtro agrupadas por `group`.
 * Usa fallback local se a API estiver indisponível.
 *
 * Este hook é chamado em dezoito lugares — páginas, PartidasPerto, SportSelect. Com
 * `useEffect` cada um deles disparava o próprio `GET /sports` na montagem, e
 * `sports` reaparecia em toda navegação medida na #197. Sob `useQuery` os
 * quinze compartilham a mesma entrada de cache: uma requisição por sessão.
 *
 * `staleTime` de uma hora porque modalidade é dado de catálogo: muda quando
 * alguém faz deploy, não durante a sessão de quem está procurando partida.
 */
export function useSports(): { sports: SportOption[]; tabs: SportTab[]; loading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: chaves.modalidades,
    queryFn: getSports,
    staleTime: 60 * 60_000,
    // O fallback local cobre a API fora do ar; sem isto o `retry` global
    // atrasaria a tela para no fim mostrar a mesma lista embutida.
    retry: false,
  })

  const loading = isPending
  const safeSports = Array.isArray(data) ? data : []
  const effectiveSports = safeSports.length > 0 && safeSports.some(s => s.group) ? safeSports : FALLBACK_SPORTS
  const tabs = deriveTabs(effectiveSports)

  return { sports: effectiveSports, tabs, loading }
}
