import { useState, useEffect } from 'react'
import { Building2, ClipboardList, LayoutDashboard, Home } from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import StatCard from '../../../components/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
import * as placesService from '../../../services/places'
import {
  StatsRow, PlaceGrid, PlaceCard, PlaceCardHeader, PlaceInfo,
  PlaceName, PlaceMeta, StatusBadge, PlaceDesc, PlaceActions,
  ActionBtn, EmptyState, ErrorMsg,
} from './styles'

const NAV_ITEMS = [
  { to: '/owner',          label: 'Visão Geral',           icon: LayoutDashboard },
  { to: '/owner/places',   label: 'Meus Estabelecimentos', icon: Building2       },
  { to: '/owner/requests', label: 'Solicitações',          icon: ClipboardList   },
  { to: '/home',           label: 'Área do Jogador',       icon: Home, divider: true },
]

const STATUS_LABEL = { OPEN: 'Aberto', CLOSED: 'Fechado' }
const STATUS_COLOR = { OPEN: '#16a34a', CLOSED: '#6b7280' }
const STATUS_BG    = { OPEN: '#dcfce7', CLOSED: '#f3f4f6' }

export default function OwnerPlaces() {
  const { user } = useAuth()
  const [places, setPlaces]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [toggling, setToggling] = useState(null)

  const fetchPlaces = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placesService.list()
      // Filtra apenas os do owner logado
      const mine = res.data.data.filter((p) => p.ownerId === user?.id)
      setPlaces(mine)
    } catch {
      setError('Não foi possível carregar seus estabelecimentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlaces() }, [])

  const handleToggleStatus = async (place) => {
    const next = place.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setToggling(place.id)
    try {
      await placesService.updateStatus(place.id, next)
      await fetchPlaces()
    } catch {
      alert('Erro ao alterar status.')
    } finally {
      setToggling(null)
    }
  }

  const totalCourts = places.reduce((acc, p) => acc + (p._count?.courts ?? 0), 0)
  const totalEvents = places.reduce((acc, p) => acc + (p._count?.events ?? 0), 0)
  const avgRating   = places.length
    ? (places.reduce((acc, p) => acc + (p.averageRating ?? 0), 0) / places.length).toFixed(1)
    : '—'

  return (
    <DashboardLayout
      user={user}
      navItems={NAV_ITEMS}
      tagline="Owner Panel"
      accent="#f59e0b"
      pageTitle="Meus Estabelecimentos"
      pageSub="Gerencie seus locais, quadras e status de cada estabelecimento"
    >
      <StatsRow>
        <StatCard label="Estabelecimentos" value={places.length} accent="#f59e0b" />
        <StatCard label="Quadras"          value={totalCourts}   accent="#22c55e" />
        <StatCard label="Peladas Ativas"   value={totalEvents}   accent="#3b82f6" />
        <StatCard label="Avaliação Média"  value={avgRating ? `${avgRating} ★` : '—'} accent="#f59e0b" />
      </StatsRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && places.length === 0 && !error && (
        <EmptyState>
          Você ainda não possui estabelecimentos cadastrados.
          <br />
          Envie uma solicitação para o Admin em <strong>Solicitações</strong>.
        </EmptyState>
      )}

      <PlaceGrid>
        {places.map((place) => (
          <PlaceCard key={place.id}>
            <PlaceCardHeader>
              <PlaceInfo>
                <PlaceName>{place.name}</PlaceName>
                <PlaceMeta>
                  {place.city && `${place.city}`}
                  {place._count?.courts != null && ` · ${place._count.courts} quadra(s)`}
                </PlaceMeta>
              </PlaceInfo>
              <StatusBadge bg={STATUS_BG[place.status]} color={STATUS_COLOR[place.status]}>
                {STATUS_LABEL[place.status] ?? place.status}
              </StatusBadge>
            </PlaceCardHeader>

            {place.description && <PlaceDesc>{place.description}</PlaceDesc>}

            <PlaceActions>
              <ActionBtn variant="secondary" as="a" href={`/owner/places/${place.id}/courts`}>
                Quadras
              </ActionBtn>
              <ActionBtn
                variant={place.status === 'OPEN' ? 'danger' : 'success'}
                onClick={() => handleToggleStatus(place)}
                disabled={toggling === place.id}
              >
                {toggling === place.id
                  ? 'Aguarde...'
                  : place.status === 'OPEN' ? 'Fechar' : 'Abrir'}
              </ActionBtn>
            </PlaceActions>
          </PlaceCard>
        ))}
      </PlaceGrid>
    </DashboardLayout>
  )
}
