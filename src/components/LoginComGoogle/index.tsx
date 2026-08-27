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
 * O provider desceu para cá, e este componente só o monta depois de um sinal
 * de intenção: passar o mouse, chegar pelo teclado, ou tocar o botão. Rota
 * autenticada nunca renderiza este componente, então nunca baixa o script.
 *
 * O clique que chega antes do script
 * ----------------------------------
 * `pointerdown` acontece antes do `click`, então o download quase sempre
 * começa antes. Quando não começa — clique de teclado, rede ruim —, o pedido
 * fica pendente e dispara sozinho assim que o script chega. Aí mora o risco
 * real desta abordagem: o popup do Google nasce de um gesto que já passou, e o
 * browser pode bloqueá-lo. O GIS avisa quando isso acontece
 * (`popup_failed_to_open`, pelo `onNonOAuthError`), e a resposta é pedir o
 * segundo clique em vez de deixar a pessoa olhando para um botão que não fez
 * nada.
 *
 * Falha de script
 * ---------------
 * Com o provider no `App`, script bloqueado deixava o botão clicável e mudo:
 * `useGoogleLogin` devolve uma função que chama `clientRef.current?.…`, e sem
 * script `clientRef.current` é `undefined`. Aqui o erro tem estado próprio, o
 * botão sai do ar e a pessoa é mandada para o formulário de e-mail, que
 * continua inteiro.
 */

import { useCallback, useEffect, useState } from 'react'
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
 * O botão de verdade, já dentro do provider — é aqui que `useGoogleLogin`
 * pode ser chamado.
 */
function BotaoDentroDoProvider({
  rotulo, desabilitado, onSucesso, onErro, cliquePendente, aoPedir, aoConsumirPendente, aoFalhar,
}: Props & {
  cliquePendente: boolean
  aoPedir: () => void
  aoConsumirPendente: () => void
  aoFalhar: (motivo: string) => void
}) {
  // `scriptLoadedSuccessfully` é o que separa "o botão existe" de "o botão
  // funciona": antes dele, `useGoogleLogin` devolve uma função que não faz
  // nada, porque o client do GIS ainda não foi criado.
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

  return (
    <Botao
      type="button"
      onClick={() => (pronto ? abrirGoogle() : aoPedir())}
      disabled={desabilitado}
    >
      <LogoDoGoogle />
      {cliquePendente && !pronto ? 'Conectando com o Google…' : rotulo}
    </Botao>
  )
}

export default function LoginComGoogle({ rotulo, desabilitado, onSucesso, onErro }: Props) {
  const clientId = env.googleClientId
  const [estado, setEstado] = useState<Estado>('inerte')
  const [cliquePendente, setCliquePendente] = useState(false)

  const despertar = useCallback(() => {
    setEstado((atual) => (atual === 'inerte' ? 'carregando' : atual))
  }, [])

  const pedir = useCallback(() => setCliquePendente(true), [])
  const consumirPendente = useCallback(() => setCliquePendente(false), [])

  const falhar = useCallback((motivo: string) => {
    setEstado('falhou')
    onErro(motivo)
  }, [onErro])

  // Sem client id configurado o botão não teria o que fazer — e a #226 mediu
  // o custo de baixar o script para nada.
  if (!clientId) {
    return (
      <Wrapper>
        <Botao type="button" disabled>
          <LogoDoGoogle />
          {rotulo}
        </Botao>
      </Wrapper>
    )
  }

  if (estado === 'inerte' || estado === 'falhou') {
    const falhou = estado === 'falhou'
    return (
      <Wrapper>
        <Botao
          type="button"
          disabled={desabilitado || falhou}
          // Três portas para o mesmo sinal: mouse, teclado e toque. O
          // `pointerdown` é o que salva o toque — ele chega antes do `click`,
          // e é ali que o download começa.
          onPointerEnter={despertar}
          onFocus={despertar}
          onPointerDown={despertar}
          onClick={() => { despertar(); pedir() }}
        >
          <LogoDoGoogle />
          {falhou ? 'Google indisponível — use seu e-mail' : rotulo}
        </Botao>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <GoogleOAuthProvider
        clientId={clientId}
        onScriptLoadSuccess={() => setEstado('pronto')}
        onScriptLoadError={() => falhar('Não foi possível carregar o Google. Entre com seu e-mail.')}
      >
        <BotaoDentroDoProvider
          rotulo={rotulo}
          desabilitado={desabilitado}
          onSucesso={onSucesso}
          onErro={onErro}
          cliquePendente={cliquePendente}
          aoPedir={pedir}
          aoConsumirPendente={consumirPendente}
          aoFalhar={falhar}
        />
      </GoogleOAuthProvider>
    </Wrapper>
  )
}
