/**
 * O que a busca devolve, virado no que o mapa desenha.
 *
 * **Em arquivo separado do componente, e não por causa do lint.** Quem chama
 * esta função é a tela de busca, que a importa de forma estática; se ela
 * morasse no `index.tsx`, esse import arrastaria o Leaflet junto e desfaria o
 * `import()` que existe para mantê-lo fora do bundle de quem nunca abre o mapa
 * (#325, e a razão está na #317).
 *
 * Partida sem coordenada é descartada em vez de virar pino no meio do oceano:
 * `latitude` e `longitude` são nulas enquanto o geocoder não resolve o endereço
 * do espaço, e `[0, 0]` fica no Golfo da Guiné.
 */

import type { Partida } from '../../types/api'
import type { PontoDaPartida } from './tipos'

export function pontosDaBusca(partidas: Partida[]): PontoDaPartida[] {
  return partidas.flatMap((partida) => {
    const local = partida.court?.place
    if (local?.latitude == null || local.longitude == null) return []

    return [{
      id: partida.id,
      latitude: local.latitude,
      longitude: local.longitude,
      titulo: local.name,
      detalhe: `${partida.court?.name ?? ''} · ${new Date(partida.date).toLocaleDateString('pt-BR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    }]
  })
}
