import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente de cache de estado de servidor (#198).
 *
 * Antes, cada página buscava tudo do zero na montagem: três visitas seguidas à
 * Home custavam 200 / 202 / 200 ms a 180 ms de RTT — constante morto, porque o
 * dado que tinha chegado segundos antes era descartado.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Um minuto de frescor. Cobre a navegação de ida e volta, que é o caso
       * que dói, sem deixar a tela mentir por muito tempo: dado de partida
       * muda com gente entrando e saindo.
       */
      staleTime: 60_000,
      /**
       * A API responde em 2–3 ms; quando falha, é rede ou 4xx, e repetir três
       * vezes só adia o erro na cara de quem está olhando. Uma tentativa extra
       * cobre o soluço de rede e para por aí.
       */
      retry: 1,
      /**
       * Desligado de propósito: com `staleTime` de um minuto isto só
       * dispararia rajada de refetch em quem alterna entre abas, sem ganho —
       * o dado ainda está fresco.
       */
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Chaves de cache em um lugar só.
 *
 * Chave montada à mão no meio do componente é como o cache passa a errar:
 * a query grava em `['events']` e a invalidação procura `['event']`, ninguém
 * percebe, e a tela fica velha em silêncio.
 */
export const chaves = {
  modalidades: ['modalidades'] as const,
  formatosDeCampeonato: ['formatos-de-campeonato'] as const,
  eventos: {
    busca:       (filtros: unknown) => ['eventos', 'busca', filtros] as const,
    participando: () => ['eventos', 'participando'] as const,
    criados:      () => ['eventos', 'criados'] as const,
    /**
     * As recomendadas dependem da ORIGEM e do raio (#223).
     *
     * A origem entra na chave porque a resposta muda com ela: quem estava em
     * casa e abriu o app na quadra precisa de outra lista, e reaproveitar o
     * cache mostraria distâncias de onde a pessoa não está mais.
     */
    recomendadas: (origem: { latitude: number; longitude: number } | null, raioKm: number) =>
      ['eventos', 'recomendadas', origem?.latitude ?? null, origem?.longitude ?? null, raioKm] as const,
  },
  times: {
    meus:    () => ['times', 'meus'] as const,
    porId:   (teamId: string) => ['times', teamId] as const,
    partidas: (teamId: string) => ['times', teamId, 'partidas'] as const,
    convites: () => ['times', 'convites'] as const,
  },
  quadras: () => ['quadras'] as const,
  /**
   * A agenda entra no cache por quadra **e por dia** (api#443).
   *
   * O dia faz parte da chave porque a resposta muda com ele: quem olhou terça e
   * foi para quarta veria as marcações de terça desenhadas sobre a quarta.
   */
  agendaDaQuadra: (courtId: string, dia: string) => ['quadras', courtId, 'agenda', dia] as const,
  perfisEsportivos: () => ['perfis-esportivos'] as const,
  estatisticas: () => ['estatisticas'] as const,
}
