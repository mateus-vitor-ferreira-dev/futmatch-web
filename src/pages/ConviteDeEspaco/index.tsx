import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { professoresService } from '../../services/professores'
import { codigoDeErro, mensagemDeErro } from '../../utils/apiError'
import { Skeleton } from '../../components/Skeleton'
/*
 * Os estilos vêm da tela vizinha, e não de uma cópia.
 *
 * As duas são o mesmo cartão sobre o mesmo fundo — o que muda é o que se
 * pergunta dentro dele. Duplicar 150 linhas de styled-components daria duas
 * telas que divergem visualmente na primeira vez que alguém mexer numa só. É o
 * mesmo caminho que `ResetPassword` e `ForgotPassword` já fazem com os estilos
 * do `Register`.
 */
import {
  Acoes, Cartao, Emblema, Fundo, LinkPrincipal, LinkSecundario, Prazo, Principal, Texto, Titulo,
} from '../ConviteDeProfessor/styles'

const formataPrazo = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

/**
 * Por que o link não vale mais — **três motivos, três frases** (api#509).
 *
 * A tela vizinha, do convite por e-mail, diz de propósito a MESMA coisa para
 * vencido e inexistente: a api responde 404 para os dois, e distinguir aqui
 * devolveria pela interface o que ela tinha acabado de esconder.
 *
 * Aqui é o oposto, e pela mesma lógica levada ao caso certo: a api **separa** os
 * três, porque o que a pessoa faz em seguida é diferente. Juntá-los jogaria fora
 * informação que ela mandou de propósito, e mandaria desistir quem só precisava
 * pedir outro link.
 */
const RECUSA: Record<string, { titulo: string; texto: string }> = {
  PLACE_INVITE_LINK_EXPIRED: {
    titulo: 'Este link venceu',
    texto: 'Ele tinha prazo e o prazo passou. Peça um link novo a quem te mandou este.',
  },
  PLACE_INVITE_LINK_EXHAUSTED: {
    titulo: 'Este link já foi usado',
    texto:
      'Cada link vale para um número limitado de pessoas, e esse limite acabou. Peça um link novo — não é preciso mudar nada na sua conta.',
  },
  PLACE_INVITE_LINK_REVOKED: {
    titulo: 'Este link foi desativado',
    texto: 'Quem criou o link o desativou. Se você deveria ter acesso, fale com o espaço.',
  },
}

const RECUSA_PADRAO = {
  titulo: 'Link indisponível',
  texto: 'Este link não vale. Confira se você copiou o endereço inteiro, ou peça outro.',
}

/**
 * Entrar num espaço por um link (web#410, api#509).
 *
 * ## Não é a tela do convite de professor, e as diferenças são o assunto
 *
 * A vizinha responde uma **pergunta a alguém**: o convite foi endereçado a um
 * e-mail, e ela existe para a pessoa aceitar ou recusar. Esta responde a um
 * **link ao portador** — ninguém perguntou nada, e quem tiver o endereço entra.
 *
 * Daí as três ausências, e nenhuma é esquecimento:
 *
 * - **Não tem "Recusar".** Não há o que recusar. Quem não quer, fecha a aba.
 * - **Não tem o caso "conta errada".** Qualquer conta serve — a vizinha gasta um
 *   bloco inteiro nisso porque lá o e-mail é a chave, e aqui não é.
 * - **Os três motivos de recusa aparecem separados**, ao contrário de lá. Ver o
 *   `RECUSA` acima.
 *
 * ## Deslogada, e é o ponto
 *
 * `GET /place-invite-links/verify` é pública porque quem chega pode não ter
 * conta e precisa ver de que espaço é antes de decidir se vale se cadastrar.
 * Por isso a página fica fora do `PrivateRoute` e monta o próprio fundo.
 */
export default function ConviteDeEspaco() {
  const [params] = useSearchParams()
  const token = params.get('link') ?? ''
  const { isAuthenticated, loading: verificandoSessao, refreshUser } = useAuth()
  const [desfecho, setDesfecho] = useState<'entrou' | 'jaEra' | null>(null)

  const link = useQuery({
    queryKey: ['convite-de-espaco', token],
    queryFn: () => professoresService.verificarLink(token),
    enabled: Boolean(token),
    // O link não muda enquanto a pessoa lê a tela, e revalidar a cada foco de
    // janela só produziria um erro novo depois de já ter entrado.
    staleTime: Infinity,
    retry: false,
  })

  const entrar = useMutation({
    mutationFn: () => professoresService.entrarPeloLink(token),
    onSuccess: async ({ novo }) => {
      /*
       * 200 e 201 dizem coisas diferentes, e a tela usa as duas.
       *
       * A api responde 200 quando o vínculo já existia — quem recarrega a
       * página não cria nada e não gasta uso. Dizer "pronto!" nos dois casos
       * faria a pessoa achar que entrou duas vezes, e o dono veria o contador
       * de usos não bater com a lista de gente.
       */
      setDesfecho(novo ? 'entrou' : 'jaEra')
      // O vínculo novo entra no `/auth/me`, e é de lá que a sidebar e o perfil
      // leem "professor em". Sem recarregar, a pessoa entra e o app continua
      // dizendo que ela não é professora de lugar nenhum.
      if (novo) await refreshUser()
    },
    onError: (err) => toast.error(mensagemDeErro(err)),
  })

  const voltarPraCa = `/convite-espaco?link=${encodeURIComponent(token)}`

  /** O token sumiu do caminho: endereço copiado pela metade, quase sempre. */
  if (!token) {
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom="erro"><AlertTriangle size={26} aria-hidden /></Emblema>
          <Titulo>Link incompleto</Titulo>
          <Texto>
            Falta o código no endereço. Abra o link inteiro, sem copiar e colar pedaços dele.
          </Texto>
        </Cartao>
      </Fundo>
    )
  }

  if (link.isPending || verificandoSessao) {
    return (
      <Fundo>
        <Cartao><Skeleton height="120px" /></Cartao>
      </Fundo>
    )
  }

  if (link.isError) {
    const { titulo, texto } = RECUSA[codigoDeErro(link.error) ?? ''] ?? RECUSA_PADRAO
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom="erro"><AlertTriangle size={26} aria-hidden /></Emblema>
          <Titulo>{titulo}</Titulo>
          <Texto>{texto}</Texto>
          <Acoes>
            <LinkSecundario to="/home">Ir para o início</LinkSecundario>
          </Acoes>
        </Cartao>
      </Fundo>
    )
  }

  const { place, expiresAt } = link.data

  if (desfecho) {
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom="feito"><Check size={26} aria-hidden /></Emblema>
          <Titulo>{desfecho === 'entrou' ? 'Pronto!' : 'Você já estava aqui'}</Titulo>
          <Texto>
            {desfecho === 'entrou'
              ? `Você agora é professor em ${place.name}.`
              : `Você já é professor em ${place.name}. Nada mudou, e este link não foi gasto.`}
          </Texto>
          <Acoes>
            <LinkPrincipal to="/home">Ir para o início</LinkPrincipal>
          </Acoes>
        </Cartao>
      </Fundo>
    )
  }

  return (
    <Fundo>
      <Cartao>
        <Emblema $tom="convite"><Link2 size={26} aria-hidden /></Emblema>
        <Titulo>{place.name}</Titulo>
        <Texto>Este link põe você como <strong>professor</strong> deste espaço.</Texto>
        <Texto>
          O papel vale só dentro dele, e não muda nada no resto da sua conta.
        </Texto>
        <Prazo>O link vale até {formataPrazo(expiresAt)}.</Prazo>

        {isAuthenticated ? (
          <Acoes>
            <Principal type="button" disabled={entrar.isPending} onClick={() => entrar.mutate()}>
              <Check size={16} aria-hidden /> Entrar como professor
            </Principal>
          </Acoes>
        ) : (
          <>
            <Texto style={{ marginTop: 20 }}>
              {/* Sem "com o e-mail que recebeu o convite": aqui não há
                  destinatário, e repetir a frase da tela vizinha faria a pessoa
                  procurar um e-mail que nunca existiu. */}
              Entre na sua conta para usar este link. Se ainda não tem conta no Só+1, crie uma
              — o link continua valendo.
            </Texto>
            <Acoes>
              <LinkPrincipal to={`/login?next=${encodeURIComponent(voltarPraCa)}`}>
                Entrar
              </LinkPrincipal>
              <LinkSecundario to={`/register?next=${encodeURIComponent(voltarPraCa)}`}>
                Criar conta
              </LinkSecundario>
            </Acoes>
          </>
        )}
      </Cartao>
    </Fundo>
  )
}
