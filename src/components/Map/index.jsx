import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { EventCard } from '../EventCard'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const MOCK_EVENTS = [
  {
    id: '1',
    courtName: 'Quadra Futsal A',
    type: 'FUTSAL',
    place: 'Arena SportZone',
    city: 'São Paulo',
    maxPlayers: 10,
    participations: 4,
    totalValue: '200',
    status: 'WAITING',
    date: '2026-06-15T19:00:00.000Z',
    lat: -23.5969,
    lng: -46.6848,
  },
  {
    id: '2',
    courtName: 'Campo Society 1',
    type: 'SOCIETY',
    place: 'Arena SportZone',
    city: 'São Paulo',
    maxPlayers: 18,
    participations: 5,
    totalValue: '360',
    status: 'WAITING',
    date: '2026-06-20T20:00:00.000Z',
    lat: -23.5991,
    lng: -46.6872,
  },
  {
    id: '3',
    courtName: 'Quadra Futsal',
    type: 'FUTSAL',
    place: 'Complex Barra Sports',
    city: 'Rio de Janeiro',
    maxPlayers: 10,
    participations: 2,
    totalValue: '180',
    status: 'FULL',
    date: '2026-06-18T21:00:00.000Z',
    lat: -23.0003,
    lng: -43.3654,
  },
]

function CardOverlay({ event, onClose }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1001,
    }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            zIndex: 1002,
            background: '#ff5252',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >✕</button>
        <EventCard event={event} />
      </div>
    </div>
  )
}

export function Map({ events = MOCK_EVENTS }) {
  const [selectedEvent, setSelectedEvent] = useState(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={4}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            eventHandlers={{ click: () => setSelectedEvent(event) }}
          />
        ))}
      </MapContainer>

      {selectedEvent && (
        <CardOverlay
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}