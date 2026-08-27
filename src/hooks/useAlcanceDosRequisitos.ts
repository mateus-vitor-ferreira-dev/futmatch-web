import { useEffect, useRef, useState } from 'react'
import { playerService } from '../services/playerService'
import type {
  AlcanceDosRequisitos,
  PartidaRequirement,
} from '../types/api'

/**
 * Quantos jogadores passariam nos requisitos que o organizador está montando.
 *
 * ## Por que existe
 *
 * A web#228 pediu isto e não teve como entregar: *"sem nenhum retorno, o
 * organizador empilha requisitos e só descobre o efeito quando ninguém
 * aparece"*. A api passou a responder na #388, e este hook é o lado de cá.
 *
 * ## O atraso não é otimização
 *
 * A tela muda a cada tecla — arrastar o controle de presença de 50% a 90%
 * dispara uma dúzia de mudanças —, e cada uma seria uma requisição que faz
 * quatro consultas no banco. O Swagger da rota pede `debounce` com todas as
 * letras.
 *
 * `ATRASO_MS` é curto de propósito: o número existe para dar retorno enquanto a
 * pessoa mexe, e meio segundo de espera já o transforma em algo que ela lê
 * depois de ter decidido.
 *
 * ## Falhar em silêncio é o certo aqui
 *
 * Sem alcance, a tela cai no aviso heurístico que existia antes — que continua
 * sendo o piso, e não some por causa desta funcionalidade. Um erro vermelho por
 * uma **estimativa** que não carregou tiraria a atenção do que o organizador
 * está de fato fazendo.
 */

const ATRASO_MS = 400

export interface EstadoDoAlcance {
  alcance: AlcanceDosRequisitos | null
  carregando: boolean
}

export function useAlcanceDosRequisitos(
  courtId: string | undefined,
  requisitos: PartidaRequirement[],
): EstadoDoAlcance {
  const [alcance, setAlcance] = useState<AlcanceDosRequisitos | null>(null)
  const [carregando, setCarregando] = useState(false)

  /**
   * A assinatura do que já foi pedido.
   *
   * Sem ela, toda renderização do componente pai — e há muitas, porque ele
   * guarda o formulário inteiro — reiniciaria o temporizador com a mesma
   * lista, e a estimativa nunca chegaria enquanto alguém digitasse em qualquer
   * outro campo da tela.
   */
  const assinatura = JSON.stringify(requisitos.map(({ type, params }) => [type, params]))
  const ultimaPedida = useRef<string | null>(null)

  useEffect(() => {
    if (!courtId) {
      setAlcance(null)
      return
    }
    if (assinatura === ultimaPedida.current) return

    let cancelado = false
    setCarregando(true)

    const temporizador = setTimeout(() => {
      void (async () => {
        ultimaPedida.current = assinatura

        try {
          // `await`, e não `.then`: o encadeamento estoura com "Cannot read
          // properties of undefined" quando o serviço devolve `undefined` — que
          // é o que um mock incompleto faz —, e o erro sobe FORA do teste, como
          // rejeição não tratada. Foi assim que este hook derrubou o CI sem
          // derrubar teste nenhum.
          const res = await playerService.estimarAlcance(courtId, requisitos)
          if (!cancelado) setAlcance(res.data)
        } catch {
          // Silêncio de propósito — ver o comentário do módulo.
          if (!cancelado) setAlcance(null)
        } finally {
          if (!cancelado) setCarregando(false)
        }
      })()
    }, ATRASO_MS)

    return () => {
      cancelado = true
      clearTimeout(temporizador)
      setCarregando(false)
    }
    // `requisitos` fica de fora: é array novo a cada render, e o que importa
    // é o conteúdo — que a `assinatura` já representa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, assinatura])

  return { alcance, carregando }
}
