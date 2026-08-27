/**
 * O mapa da busca: onde estão as partidas que a lista mostra, e até onde vai o
 * raio escolhido (#325).
 *
 * **Este arquivo é o único do projeto que importa Leaflet, e ele nunca é
 * importado direto.** Quem o traz é um `import()` na tela de busca, e essa é a
 * condição de existir: o `components/Map` antigo importava `react-leaflet`,
 * `leaflet` e o CSS no topo, e pelo barrel isso punha 236 KiB de Leaflet no
 * chunk que a **tela de cadastro** baixava. A #317 tirou aquilo do carregamento
 * inicial e a #354 apagou o componente morto; pendurar o mapa aqui sem `lazy`
 * desfaria as duas.
 *
 * O `scripts/verifica-primeira-tela.mjs` continua barrando `leaflet` no alcance
 * das telas sem sessão. Ele não precisa saber deste arquivo: a travessia dele
 * para em cada `import()`, que é exatamente onde o bundler corta o chunk.
 *
 * O que ele desenha
 * -----------------
 * A origem, um círculo com o raio escolhido, e um pino por partida. A origem é
 * um ponto próprio, e não um pino igual aos outros: ela não é um jogo, é de
 * onde a distância é medida — desenhá-la igual faria parecer que há uma partida
 * onde a pessoa está.
 *
 * Sem raio escolhido — o "Qualquer" do filtro é `0` — não há círculo. Desenhar
 * um raio inventado seria pior do que não desenhar nenhum: o mapa passaria a
 * afirmar um recorte que a busca não fez.
 *
 * Por que ele não rouba a rolagem
 * -------------------------------
 * `scrollWheelZoom` desligado. Mapa que captura a roda do mouse é a forma mais
 * conhecida de prender quem está só rolando a página — e aqui o mapa é apoio à
 * lista, não o conteúdo principal. Quem quiser aproximar usa os botões, que
 * continuam lá.
 */

import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PontoDaPartida } from './tipos'
import { Moldura } from './styles'

/**
 * O Leaflet resolve os ícones por caminho relativo ao bundle, o que quebra com
 * o hashing do Vite. Um ícone desenhado aqui evita tanto o caminho quebrado
 * quanto o `unpkg` que o componente antigo usava — que era rede de terceiro
 * para desenhar um pino.
 */
const PINO = L.divIcon({
  className: '',
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:9999px;
    background:#22c55e;border:2px solid #052e16;box-shadow:0 0 0 3px rgba(34,197,94,.25)
  "></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface Props {
  origem: { latitude: number; longitude: number }
  /** Em km. `0` é o "Qualquer" do filtro: sem recorte, e por isso sem círculo. */
  raioKm: number
  partidas: PontoDaPartida[]
}

/**
 * Reenquadra quando o raio muda.
 *
 * Sem isto o mapa fica no zoom inicial: a pessoa escolhe 50 km, o círculo cresce
 * para fora da tela, e o mapa não acompanha — parece que o filtro não funcionou.
 */
function AcompanhaORaio({ origem, raioKm }: { origem: Props['origem']; raioKm: number }) {
  const mapa = useMap()

  useEffect(() => {
    const centro: L.LatLngExpression = [origem.latitude, origem.longitude]
    if (raioKm > 0) {
      mapa.fitBounds(L.latLng(centro).toBounds(raioKm * 2000), { padding: [16, 16] })
    } else {
      mapa.setView(centro, 12)
    }
  }, [mapa, origem.latitude, origem.longitude, raioKm])

  return null
}

export default function MapaDaBusca({ origem, raioKm, partidas }: Props) {
  const centro: L.LatLngExpression = [origem.latitude, origem.longitude]

  return (
    <Moldura>
      <MapContainer
        center={centro}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        aria-label="Mapa das partidas encontradas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AcompanhaORaio origem={origem} raioKm={raioKm} />

        {raioKm > 0 && (
          <Circle
            center={centro}
            radius={raioKm * 1000}
            pathOptions={{ color: '#22c55e', weight: 1, fillColor: '#22c55e', fillOpacity: 0.06 }}
          />
        )}

        {/* A origem é um ponto, e não um pino: ela não é uma partida. */}
        <CircleMarker
          center={centro}
          radius={6}
          pathOptions={{ color: '#052e16', weight: 2, fillColor: '#e5e7eb', fillOpacity: 1 }}
        >
          <Popup>Você está aqui</Popup>
        </CircleMarker>

        {partidas.map((partida) => (
          <Marker key={partida.id} position={[partida.latitude, partida.longitude]} icon={PINO}>
            <Popup>
              <strong>{partida.titulo}</strong>
              <br />
              {partida.detalhe}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Moldura>
  )
}
