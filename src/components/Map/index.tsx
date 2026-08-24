import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { CourtType } from '../../types/api'

/**
 * Evento como este mapa o consome: forma achatada, com lat/lng no próprio
 * evento — não é o `Partida` da API, que aninha o endereço sob court.place.
 */
export interface MapEvent {
  id: string
  lat: number
  lng: number
  place?: string
  courtName?: string
  city?: string
  type: CourtType
  maxPlayers: number
  /** Contagem de participantes, não a lista. */
  participations: number
  totalValue: string | number
  date?: string
  status?: string
}

interface MapLocation {
  lat: number
  lng: number
  events: MapEvent[]
}

// O Leaflet resolve os ícones por caminho relativo ao bundle, o que quebra com
// o hashing do Vite; a remoção força o uso das URLs absolutas abaixo.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SPORT_LABELS = {
  SOCIETY:      'Society',
  CAMPO:        'Futebol de Campo',
  FUTSAL:       'Futsal',
  AREIA:        'Futevôlei',
  VOLEI:        'Vôlei',
  VOLEI_AREIA:  'Vôlei de Areia',
  HANDBALL:     'Handebol',
  PETECA:       'Peteca',
  BEACH_TENNIS: 'Beach Tennis',
  BASQUETE:     'Basquete',
  TENIS:        'Tênis',
  POKER:        'Poker',
}

const MOCK_EVENTS: MapEvent[] = [
  {
    id: '1', courtName: 'Quadra Futsal A', type: 'FUTSAL',
    place: 'Arena SportZone', city: 'São Paulo',
    maxPlayers: 10, participations: 4, totalValue: '200', status: 'WAITING',
    lat: -23.5969, lng: -46.6848,
  },
  {
    id: '2', courtName: 'Campo Society 1', type: 'SOCIETY',
    place: 'Arena SportZone', city: 'São Paulo',
    maxPlayers: 18, participations: 5, totalValue: '360', status: 'WAITING',
    lat: -23.5969, lng: -46.6848,
  },
  {
    id: '3', courtName: 'Quadra Futsal', type: 'FUTSAL',
    place: 'Arena João Dono', city: 'Rio de Janeiro',
    maxPlayers: 10, participations: 2, totalValue: '180', status: 'WAITING',
    lat: -23.0003, lng: -43.3654,
  },
]

function AutoFit({ locations }: { locations: MapLocation[] }) {
  const map = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    if (locations.length === 0 || fittedRef.current) return

    if (locations.length === 1) {
      map.setView([locations[0]!.lat, locations[0]!.lng], 14)
    } else {
      const bounds = L.latLngBounds(locations.map((l): [number, number] => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [48, 48] })
    }

    fittedRef.current = true
  }, [locations, map])

  return null
}

function LocationPopup({ locEvents }: { locEvents: MapEvent[] }) {
  const primeira = locEvents[0]!

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', minWidth: 220 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
          {primeira.place || primeira.courtName}
        </div>
        {primeira.city && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            📍 {primeira.city}
          </div>
        )}
      </div>

      {locEvents.map((event, i) => {
        const vagas          = event.maxPlayers - event.participations
        const pricePerPerson = (Number(event.totalValue) / event.maxPlayers).toFixed(0)
        const sportLabel     = SPORT_LABELS[event.type] || event.type

        return (
          <div
            key={event.id}
            style={{
              borderTop:  '1px solid #e5e7eb',
              paddingTop: 8,
              marginTop:  i > 0 ? 8 : 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: '#dcfce7', color: '#166534',
                padding: '2px 7px', borderRadius: 4,
              }}>
                {sportLabel}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                R$ {pricePerPerson}/p
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
              {event.courtName}
            </div>

            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
              👥 {event.participations}/{event.maxPlayers} confirmados
              {' · '}
              <span style={{ color: vagas > 0 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                {vagas > 0 ? `${vagas} vaga${vagas !== 1 ? 's' : ''}` : 'Lotado'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Map({ events = MOCK_EVENTS }: { events?: MapEvent[] }) {
  const grouped = events.reduce<Record<string, MapLocation>>((acc, event) => {
    const key = `${event.lat},${event.lng}`
    if (!acc[key]) acc[key] = { lat: event.lat, lng: event.lng, events: [] }
    acc[key]!.events.push(event)
    return acc
  }, {})

  const locations: MapLocation[] = Object.values(grouped)

  return (
    <MapContainer
      center={[-15.7801, -47.9292]}
      zoom={4}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoFit locations={locations} />

      {locations.map(({ lat, lng, events: locEvents }) => (
        <Marker key={`${lat},${lng}`} position={[lat, lng]}>
          <Popup minWidth={230} maxWidth={290}>
            <LocationPopup locEvents={locEvents} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
