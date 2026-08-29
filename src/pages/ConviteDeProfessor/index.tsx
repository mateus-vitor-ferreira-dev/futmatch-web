import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, GraduationCap, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { professoresService } from '../../services/professores'
import { codigoDeErro, mensagemDeErro } from '../../utils/apiError'
import { Skeleton } from '../../components/Skeleton'
import {
  Acoes, Aviso, Cartao, ContaAtual, Emblema, Fundo, LinkPrincipal, LinkSecundario,
  Prazo, Principal, Secundario, Texto, Titulo,
} from './styles'

const formataPrazo = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

/**
 * O convite de professor, aberto pelo link do e-mail (web#377, api#451).
 *
 * ## Funciona deslogada, e é o ponto
 *
 * `GET /place-invites/verify` é pública de propósito: quem ainda não tem conta
 * precisa ver **de quem é o convite** antes de decidir se vale se cadastrar. É
 * o caminho que separou este modelo do `TeamInvite`, que aponta para um
 * `userId` e responde 404 para e-mail sem conta — a academia que contrata um
 * professor de fora não passaria por ele.
 *
 * Por isso a página fica fora do `PrivateRoute` e monta o próprio fundo, em vez
 * de viver dentro do layout autenticado.
 *
 * ## A conta errada não é um erro genérico
 *
 * O convite é endereçado a um **e-mail**, e a api confere isso contra o banco —
 * não contra o JWT, que carrega o e-mail de quando foi assinado. Quem clica no
 * link estando logado em outra conta leva `403 PLACE_INVITE_OTHER_EMAIL`, e é o
 * caso mais fácil de tratar mal: "não foi possível aceitar" manda a pessoa
 * tentar de novo no lugar de trocar de conta. A tela nomeia a conta em que ela
 * está e oferece a saída.
 *
 * ## Vencido e inexistente dizem a mesma coisa
 *
 * A api responde 404 para os dois, de propósito — quem está com um link velho
 * não precisa saber que ele um dia existiu. A tela **não inventa** a diferença:
 * distinguir aqui devolveria pela interface o que a api tinha acabado de
 * esconder, como a agenda faz com a partida privada.
 */
export default function ConviteDeProfessor() {
  const [params] = useSearchParams()
  const token = params.get('convite') ?? ''
  const { user, isAuthenticated, loading: verificandoSessao, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [desfecho, setDesfecho] = useState<'aceito' | 'recusado' | null>(null)

  const convite = useQuery({
    queryKey: ['convite-de-professor', token],
    queryFn: () => professoresService.verificar(token),
    enabled: Boolean(token),
    // Convite não é dado que muda enquanto a pessoa lê a tela, e revalidar a
    // cada foco de janela só produziria um 404 novo depois de aceito.
    staleTime: Infinity,
    retry: false,
  })

  const responder = useMutation({
    // O retorno é descartado de propósito: aceitar devolve o vínculo e recusar
    // devolve o status, e a tela não precisa de nenhum dos dois — o que ela
    // mostra depois já veio do `verify`. Tipar como `void` evita um union que
    // existiria só para ser ignorado.
    mutationFn: async (acao: 'aceitar' | 'recusar'): Promise<void> => {
      if (acao === 'aceitar') await professoresService.aceitar(token)
      else await professoresService.recusar(token)
    },
    onSuccess: async (_dados, acao) => {
      setDesfecho(acao === 'aceitar' ? 'aceito' : 'recusado')
      // O vínculo novo entra no `/auth/me`, e é de lá que a sidebar e o perfil
      // leem "professor em". Sem recarregar, a pessoa aceita e o app continua
      // dizendo que ela não é professora de lugar nenhum.
      if (acao === 'aceitar') await refreshUser()
    },
    onError: (err) => {
      if (codigoDeErro(err) !== 'PLACE_INVITE_OTHER_EMAIL') toast.error(mensagemDeErro(err))
    },
  })

  const contaErrada = codigoDeErro(responder.error) === 'PLACE_INVITE_OTHER_EMAIL'
  const voltarPraCa = `/convite-professor?convite=${encodeURIComponent(token)}`

  /** O convite sumiu do caminho: link truncado por um cliente de e-mail, quase sempre. */
  if (!token) {
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom="erro"><AlertTriangle size={26} aria-hidden /></Emblema>
          <Titulo>Link incompleto</Titulo>
          <Texto>
            Falta o código do convite no endereço. Abra o link direto do e-mail, sem copiar
            e colar pedaços dele.
          </Texto>
        </Cartao>
      </Fundo>
    )
  }

  if (convite.isPending || verificandoSessao) {
    return (
      <Fundo>
        <Cartao><Skeleton height="120px" /></Cartao>
      </Fundo>
    )
  }

  if (convite.isError) {
    const jaRespondido = codigoDeErro(convite.error) === 'PLACE_INVITE_ALREADY_ANSWERED'
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom="erro"><AlertTriangle size={26} aria-hidden /></Emblema>
          <Titulo>{jaRespondido ? 'Este convite já foi respondido' : 'Convite indisponível'}</Titulo>
          <Texto>
            {jaRespondido
              ? 'Alguém já aceitou ou recusou este convite. Se foi engano, peça ao dono do espaço para enviar outro.'
              : 'Este link não vale mais. Pode ter vencido ou sido substituído por um mais novo — peça ao dono do espaço para enviar outro.'}
          </Texto>
          <Acoes>
            <LinkSecundario to="/home">Ir para o início</LinkSecundario>
          </Acoes>
        </Cartao>
      </Fundo>
    )
  }

  const { place, expiresAt } = convite.data

  if (desfecho) {
    return (
      <Fundo>
        <Cartao>
          <Emblema $tom={desfecho === 'aceito' ? 'feito' : 'erro'}>
            {desfecho === 'aceito' ? <Check size={26} aria-hidden /> : <X size={26} aria-hidden />}
          </Emblema>
          <Titulo>{desfecho === 'aceito' ? 'Pronto!' : 'Convite recusado'}</Titulo>
          <Texto>
            {desfecho === 'aceito'
              ? `Você agora é professor em ${place.name}.`
              : `Você recusou o convite de ${place.name}. Nada foi criado, e o dono pode convidar de novo depois.`}
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
        <Emblema $tom="convite"><GraduationCap size={26} aria-hidden /></Emblema>
        <Titulo>{place.name}</Titulo>
        <Texto>convidou você para dar aula como <strong>professor</strong>.</Texto>
        <Texto>
          O papel vale só dentro deste espaço, e não muda nada no resto da sua conta.
        </Texto>
        <Prazo>O convite vale até {formataPrazo(expiresAt)}.</Prazo>

        {isAuthenticated ? (
          <>
            {contaErrada && (
              <Aviso role="alert">
                Este convite foi enviado para outro e-mail, e você está na conta{' '}
                <ContaAtual>{user?.email}</ContaAtual>. Entre com a conta que recebeu o
                convite — ou crie uma com aquele e-mail, se ainda não tiver.
              </Aviso>
            )}

            <Acoes>
              {contaErrada ? (
                <Principal
                  type="button"
                  onClick={() => {
                    // Sai da sessão errada e volta para cá: sem o `next`, a
                    // pessoa entraria na conta certa e cairia na home, com o
                    // link do convite já fechado no cliente de e-mail.
                    navigate(`/login?next=${encodeURIComponent(voltarPraCa)}`)
                  }}
                >
                  Entrar com outra conta
                </Principal>
              ) : (
                <>
                  <Principal
                    type="button"
                    disabled={responder.isPending}
                    onClick={() => responder.mutate('aceitar')}
                  >
                    <Check size={16} aria-hidden /> Aceitar convite
                  </Principal>
                  <Secundario
                    type="button"
                    disabled={responder.isPending}
                    onClick={() => responder.mutate('recusar')}
                  >
                    Recusar
                  </Secundario>
                </>
              )}
            </Acoes>
          </>
        ) : (
          <>
            <Texto style={{ marginTop: 20 }}>
              Entre com o e-mail que recebeu este convite para aceitar. Se ainda não tem
              conta no Só+1, crie uma com esse mesmo e-mail — o convite continua esperando.
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
