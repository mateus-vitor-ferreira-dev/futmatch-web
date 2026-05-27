import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Corrige o ícone padrão do Leaflet que quebra com Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Dados mockados para testar enquanto o banco não tem coordenadas
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
    lat: -23.5991,
    lng: -46.6872,
  },
  {
    id: '3',
    courtName: 'Quadra Futsal',
    type: 'FUTSAL',
    place: 'Arena João Dono',
    city: 'Rio de Janeiro',
    maxPlayers: 10,
    participations: 2,
    totalValue: '180',
    status: 'WAITING',
    lat: -23.0003,
    lng: -43.3654,
  },
]

export function Map({ events = MOCK_EVENTS }) {
  return (
    <MapContainer
      center={[-15.7801, -47.9292]} // centro do Brasil
      zoom={4}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {events.map((event) => (
        <Marker key={event.id} position={[event.lat, event.lng]}>
          <Popup>
            <strong>{event.place}</strong>
            <br />
            {event.courtName} — {event.type}
            <br />
            Vagas: {event.maxPlayers - event.participations}/{event.maxPlayers}
            <br />
            Valor: R$ {(Number(event.totalValue) / event.maxPlayers).toFixed(2)} por pessoa
            <br />
            Status: {event.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}