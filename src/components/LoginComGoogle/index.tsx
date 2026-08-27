/**
 * Botão "entrar com o Google" que só baixa o Google Identity Services quando
 * alguém demonstra que vai usá-lo.
 *
 * O problema
 * ----------
 * O `GoogleOAuthProvider` injeta `https://accounts.google.com/gsi/client` no
 * `useEffect` de montagem, sem condição. Enquanto ele morou no `App`, o script
 * era baixado em **toda** rota — inclusive nas autenticadas, onde não existe
 * botão do Google em lugar nenhum. Na linha de base da #226 isso custou
 * 96,30 KiB na primeira tela, dos quais o Lighthouse apontou 80,72 KiB como
 * não usados: o maior item isolado da lista.
 *
 * A solução
 * ---------
 * O provider desceu para cá e só é montado depois de um sinal de intenção:
 * passar o mouse, chegar pelo teclado, ou tocar o botão. Rota autenticada
 * nunca renderiza este componente, então nunca baixa o script.
 *
 * Por que o provider fica ao lado do botão, e não em volta
 * --------------------------------------------------------
 * Esta é a parte que parece rebuscada e não é. A versão óbvia — trocar o botão
 * inerte por um `<GoogleOAuthProvider>` com o botão dentro — **perde o
 * clique**, e isso só aparece em browser de verdade:
 *
 * - o `pointerdown` do toque acorda o componente, o React troca a subárvore, e
 *   o `click` que viria em seguida cai num elemento que já saiu do DOM;
 * - o `focus` do teclado faz o mesmo, e o foco vai parar no `body` — quem
 *   chegou de Tab perde o botão de baixo do dedo.
 *
 * Por isso o `<Botao>` visível é um só, montado desde o começo e nunca
 * substituído. Quem entra e sai é o `<Motor>`, que não desenha nada: existe
 * para hospedar o `useGoogleLogin` e entregar a função de abrir o Google por
 * uma ref.
 *
 * O clique que chega antes do script
 * ----------------------------------
 * `pointerdown` acontece antes do `click`, então o download quase sempre
 * começa antes — e em visita repetida o script vem do cache. Quando não dá
 * tempo, o pedido fica pendente e dispara assim que o script chega. Aí mora o
 * risco desta abordagem: o popup nasce de um gesto que já passou, e o browser
 * pode bloqueá-lo. O GIS avisa quando isso acontece (`popup_failed_to_open`,
 * pelo `onNonOAuthError`), e a resposta é pedir o segundo clique em vez de
 * deixar a pessoa olhando para um botão que não fez nada.
 *
 * Falha de script
 * ---------------
 * Com o provider no `App`, script bloqueado deixava o botão clicável e mudo:
 * `useGoogleLogin` devolve uma função que chama `clientRef.current?.…`, e sem
 * script `clientRef.current` é `undefined`. Aqui o erro tem estado próprio, o
 * botão sai do ar e a pessoa é mandada para o formulário de e-mail, que
 * continua inteiro.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleOAuthProvider, useGoogleLogin, useGoogleOAuth } from '@react-oauth/google'
import { env } from '../../config/env'
import { Wrapper, Botao } from './styles'

interface Props {
  /** O texto muda entre as abas: "Cadastrar com…" e "Fazer Login com…". */
  rotulo: string
  /** O formulário já está enviando — não faz sentido abrir o Google agora. */
  desabilitado?: boolean
  onSucesso: (accessToken: string) => void | Promise<void>
  onErro: (mensagem: string) => void
}

/** O estado do script, do ponto de vista de quem está olhando o botão. */
type Estado = 'inerte' | 'carregando' | 'pronto' | 'falhou'

const LogoDoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

/**
 * Não desenha nada. Existe para chamar `useGoogleLogin`, que só funciona
 * dentro do provider, e publicar a função de abrir o Google na ref de quem o
 * montou.
 */
function Motor({
  onSucesso, onErro, abrirRef, cliquePendente, aoConsumirPendente, aoFalhar,
}: Pick<Props, 'onSucesso' | 'onErro'> & {
  abrirRef: { current: (() => void) | null }
  cliquePendente: boolean
  aoConsumirPendente: () => void
  aoFalhar: (motivo: string) => void
}) {
  // `scriptLoadedSuccessfully` separa "o hook existe" de "o hook funciona":
  // antes dele, `useGoogleLogin` devolve uma função que não faz nada, porque o
  // client do GIS ainda não foi criado.
  const { scriptLoadedSuccessfully: pronto } = useGoogleOAuth()

  const abrirGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: ({ access_token }) => { void onSucesso(access_token) },
    onError: () => onErro('Login com Google cancelado.'),
    // Erro que não vem do OAuth: popup bloqueado, popup fechado antes da hora.
    // O bloqueio é a consequência esperada de disparar o fluxo a partir de um
    // gesto que já passou, e a pessoa precisa saber que basta clicar de novo.
    onNonOAuthError: ({ type }) => {
      if (type === 'popup_failed_to_open') aoFalhar('Clique de novo para continuar com o Google.')
    },
  })

  useEffect(() => {
    abrirRef.current = pronto ? abrirGoogle : null
    return () => { abrirRef.current = null }
  }, [pronto, abrirGoogle, abrirRef])

  // O clique que chegou antes do script. Dispara uma vez, quando o script
  // chega — e só então, senão `requestAccessToken` cai num client inexistente
  // e o clique some sem deixar rastro.
  //
  // `abrirGoogle` pode entrar nas dependências porque é estável: o
  // `useGoogleLogin` a devolve de um `useCallback` sem dependência nenhuma.
  useEffect(() => {
    if (!cliquePendente || !pronto) return
    aoConsumirPendente()
    abrirGoogle()
  }, [cliquePendente, pronto, aoConsumirPendente, abrirGoogle])

  return null
}

export default function LoginComGoogle({ rotulo, desabilitado, onSucesso, onErro }: Props) {
  const clientId = env.googleClientId
  const [estado, setEstado] = useState<Estado>('inerte')
  const [cliquePendente, setCliquePendente] = useState(false)
  const abrirRef = useRef<(() => void) | null>(null)

  const despertar = useCallback(() => {
    setEstado((atual) => (atual === 'inerte' ? 'carregando' : atual))
  }, [])

  const consumirPendente = useCallback(() => setCliquePendente(false), [])
  const carregou = useCallback(() => setEstado('pronto'), [])

  const falhar = useCallback((motivo: string) => {
    setEstado('falhou')
    onErro(motivo)
  }, [onErro])

  const clicar = useCallback(() => {
    despertar()
    // Com o script pronto, o popup nasce dentro do gesto — a única forma de o
    // browser não bloqueá-lo. Sem ele, o pedido espera.
    if (abrirRef.current) abrirRef.current()
    else setCliquePendente(true)
  }, [despertar])

  const falhou = estado === 'falhou'
  const conectando = cliquePendente && !falhou

  return (
    <Wrapper>
      <Botao
        type="button"
        disabled={desabilitado || falhou || !clientId}
        // Três portas para o mesmo sinal: mouse, teclado e toque. O
        // `pointerdown` é o que salva o toque — ele chega antes do `click`, e é
        // ali que o download começa.
        onPointerEnter={despertar}
        onFocus={despertar}
        onPointerDown={despertar}
        onClick={clicar}
      >
        <LogoDoGoogle />
        {falhou ? 'Google indisponível — use seu e-mail' : conectando ? 'Conectando com o Google…' : rotulo}
      </Botao>

      {/* Sem client id o botão não teria o que fazer — e a #226 mediu o custo
          de baixar o script para nada. */}
      {clientId && (estado === 'carregando' || estado === 'pronto') && (
        <GoogleOAuthProvider
          clientId={clientId}
          onScriptLoadSuccess={carregou}
          onScriptLoadError={() => falhar('Não foi possível carregar o Google. Entre com seu e-mail.')}
        >
          <Motor
            onSucesso={onSucesso}
            onErro={onErro}
            abrirRef={abrirRef}
            cliquePendente={cliquePendente}
            aoConsumirPendente={consumirPendente}
            aoFalhar={falhar}
          />
        </GoogleOAuthProvider>
      )}
    </Wrapper>
  )
}
