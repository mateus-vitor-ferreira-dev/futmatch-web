import { useQuery } from '@tanstack/react-query'
import { getAgendaDaQuadra } from '../services/courts'
import { chaves } from '../lib/queryClient'
import { limitesDoDia, diaDe } from '../utils/agenda'
import type { OcupacaoDaQuadra } from '../types/api'

/**
 * O que já ocupa a quadra no dia que o organizador está escolhendo (api#443).
 *
 * ## Por que existe
 *
 * A api tem um calendário só por quadra desde a api#446, mas ele só servia de
 * **guarda**: quem marcava por cima levava 409 depois de preencher o formulário
 * inteiro — a pior hora possível para descobrir. A api#443 virou a guarda em
 * resposta, e este hook é o lado de cá.
 *
 * ## O dia, e não a semana
 *
 * A janela pedida é o dia da data escolhida. A tela de criar partida já carrega
 * quadra, data, hora, duração, vagas, valor, Pix e regras de acesso; uma semana
 * inteira de marcações ali dentro vira ruído sobre a única coisa que a pessoa
 * está decidindo naquele instante, que é o horário daquele dia.
 *
 * ## `react-query`, e não busca à mão
 *
 * Diferente do `useAlcanceDosRequisitos`, aqui não há o que atrasar: a agenda
 * muda quando muda o **dia**, e não a cada tecla. Trocar 19h por 20h no mesmo
 * dia não é requisição nova — é a mesma lista, e o cache por (quadra, dia)
 * responde na hora.
 *
 * ## Falhar aqui NÃO é silencioso
 *
 * O oposto do alcance, e de propósito. Lá a estimativa era conforto e a tela
 * tinha um piso sem ela. Aqui, agenda que não carregou é a tela deixando de
 * barrar um horário ocupado — e quem consome precisa poder dizer isso, em vez
 * de deixar a pessoa achar que a quadra está livre. Daí `erro` sair no retorno.
 */

/**
 * Estável de propósito: `?? []` devolveria um array novo a cada render, e a
 * conta de conflito que depende dele deixaria de ser memorizável — o React
 * Compiler reprova, e com razão.
 */
const SEM_OCUPACOES: OcupacaoDaQuadra[] = []

export interface EstadoDaAgenda {
  ocupacoes: OcupacaoDaQuadra[]
  carregando: boolean
  /** `true` quando a agenda não pôde ser lida — a tela avisa que não conferiu. */
  erro: boolean
}

export function useAgendaDaQuadra(
  courtId: string | undefined,
  dataEscolhida: string | undefined,
): EstadoDaAgenda {
  const dia = dataEscolhida ? diaDe(dataEscolhida) : null
  const limites = dataEscolhida ? limitesDoDia(dataEscolhida) : null
  const habilitada = Boolean(courtId && dia && limites)

  const { data, isPending, isError } = useQuery({
    queryKey: chaves.agendaDaQuadra(courtId ?? '', dia ?? ''),
    queryFn: () => getAgendaDaQuadra(courtId!, limites!.de, limites!.ate),
    enabled: habilitada,
    /**
     * Meio minuto. A agenda é de outras pessoas e muda enquanto o formulário
     * está aberto — mas reconsultar a cada foco de janela enquanto alguém
     * preenche sete campos seria requisição por distração.
     */
    staleTime: 30_000,
  })

  return {
    ocupacoes: data?.data?.ocupacoes ?? SEM_OCUPACOES,
    // `isPending` é o estado inicial mesmo com a consulta desligada, e sem a
    // quadra ou a data não há nada carregando — só nada a pedir.
    carregando: habilitada && isPending,
    erro: habilitada && isError,
  }
}
