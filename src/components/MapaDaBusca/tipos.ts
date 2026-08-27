/** O contrato entre a tela de busca e o mapa, sem arrastar o Leaflet junto. */
export interface PontoDaPartida {
  id: string
  latitude: number
  longitude: number
  titulo: string
  detalhe: string
}
