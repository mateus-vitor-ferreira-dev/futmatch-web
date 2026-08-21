import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * De onde medir a distância até as peladas (#222).
 *
 * ## A regra que carrega esta issue
 *
 * **O prompt do navegador nunca é disparado sozinho.** Permissão pedida sem
 * contexto é negada quase sempre, e navegador nenhum pergunta de novo depois
 * disso — a pessoa teria de ir nas configurações do site para desfazer. É uma
 * chance só, e por isso quem pede é sempre um clique da pessoa, depois de a
 * tela explicar para quê.
 *
 * ## As duas origens
 *
 * A do **navegador** é a preferida: é exata, é atual, é de graça e não gasta
 * cota de geocodificação. A do **endereço salvo** é a rede de segurança — vale
 * para quem negou, para quem não tem o recurso e para quem abre o app no
 * computador de casa.
 *
 * Quando nenhuma existe, o retorno é `null` com `estado: 'sem-origem'`, e a
 * tela convida em vez de lamentar. Não ter endereço é o estado normal de quem
 * acabou de entrar.
 */

export type EstadoDaOrigem =
  /** Nem coordenada do navegador, nem endereço salvo. */
  | 'sem-origem'
  /** Esperando a resposta do prompt do navegador. */
  | 'pedindo'
  /** A pessoa recusou — agora ou numa sessão anterior. */
  | 'negado'
  /** O navegador não tem a API, ou a página não está em contexto seguro. */
  | 'indisponivel'
  /** Há origem: veja `origem.fonte` para saber qual. */
  | 'pronto'

export interface Origem {
  latitude: number
  longitude: number
  fonte: 'navegador' | 'endereco'
}

/**
 * A escolha fica no `localStorage`, e não em estado (#222).
 *
 * O critério pede que a escolha seja lembrada entre sessões: quem negou uma vez
 * não pode ver o convite de novo a cada visita, e quem aceitou não deve ter de
 * clicar de novo. O navegador guarda a permissão, mas não conta se ela foi
 * negada sem a Permissions API — e essa marca é o que cobre o resto.
 */
const CHAVE = 'so-mais-um:localizacao'

type Preferencia = 'concedida' | 'negada'

function leiaPreferencia(): Preferencia | null {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'concedida' || valor === 'negada' ? valor : null
  } catch {
    // Janela anônima, cookies bloqueados, storage cheio. A ausência de
    // preferência é um estado válido — não vale derrubar a home por isso.
    return null
  }
}

function guardePreferencia(valor: Preferencia) {
  try {
    localStorage.setItem(CHAVE, valor)
  } catch {
    // Sem preferência guardada, o app volta a perguntar na próxima visita. É
    // pior que lembrar, e muito melhor que quebrar.
  }
}

/**
 * `!= null`, e não `'geolocation' in navigator`.
 *
 * A propriedade **existe** e vale `undefined` em ambiente sem o recurso — em
 * contexto inseguro, em WebView capada, no jsdom. O `in` responderia `true` e a
 * chamada seguinte estouraria em `getCurrentPosition of undefined`, que é uma
 * falha bem pior que "este navegador não informa localização".
 */
const temGeolocalizacao = () => typeof navigator !== 'undefined' && navigator.geolocation != null

export interface OrigemDeLocalizacao {
  origem: Origem | null
  estado: EstadoDaOrigem
  /** `true` enquanto o navegador mostra o prompt. */
  pedindo: boolean
  /** Só faz sentido chamar a partir de um clique — ver o comentário do módulo. */
  pedirLocalizacao: () => void
  /** `true` quando dá para oferecer o botão: há API e a pessoa ainda não negou. */
  podePedir: boolean
}

export function useOrigemDeLocalizacao(): OrigemDeLocalizacao {
  const { user } = useAuth()
  const endereco = user?.address

  const [doNavegador, setDoNavegador] = useState<Origem | null>(null)
  const [pedindo, setPedindo] = useState(false)
  const [negado, setNegado] = useState(() => leiaPreferencia() === 'negada')

  const disponivel = temGeolocalizacao()

  /**
   * Quem já concedeu antes é lido em silêncio, sem prompt.
   *
   * O navegador não pergunta de novo quando a permissão já está concedida, e
   * pular esta leitura obrigaria a pessoa a clicar no botão em toda visita —
   * exatamente o que o critério de "lembrar a escolha" pede para evitar.
   */
  useEffect(() => {
    if (!disponivel || doNavegador || negado) return
    if (leiaPreferencia() !== 'concedida') return

    navigator.geolocation.getCurrentPosition(
      (posicao) =>
        setDoNavegador({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          fonte: 'navegador',
        }),
      () => {
        // Concedeu antes e agora falhou: pode ter revogado nas configurações.
        // Cai para o endereço salvo, sem alarde.
        guardePreferencia('negada')
        setNegado(true)
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  }, [disponivel, doNavegador, negado])

  const pedirLocalizacao = useCallback(() => {
    if (!disponivel) return
    setPedindo(true)

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        guardePreferencia('concedida')
        setDoNavegador({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          fonte: 'navegador',
        })
        setPedindo(false)
      },
      () => {
        // **Sem mensagem de erro alarmante.** Negar a localização não é falha:
        // é uma escolha legítima, e o app continua funcionando pelo endereço.
        guardePreferencia('negada')
        setNegado(true)
        setPedindo(false)
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  }, [disponivel])

  const doEndereco: Origem | null =
    endereco?.latitude != null && endereco.longitude != null
      ? { latitude: endereco.latitude, longitude: endereco.longitude, fonte: 'endereco' }
      : null

  // O navegador ganha do endereço: é mais exato e mais atual que um CEP de
  // cadastro, e é a decisão registrada na api#217.
  const origem = doNavegador ?? doEndereco

  const estado: EstadoDaOrigem = origem
    ? 'pronto'
    : pedindo
      ? 'pedindo'
      : !disponivel
        ? 'indisponivel'
        : negado
          ? 'negado'
          : 'sem-origem'

  return {
    origem,
    estado,
    pedindo,
    pedirLocalizacao,
    podePedir: disponivel && !negado && !pedindo,
  }
}
