import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, X, Clock } from 'lucide-react'
import { teamsService } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import { mensagemDeErro } from '../../utils/apiError'
import { getSportMeta } from '../../hooks/useSports'
import type { TeamInvite } from '../../types/api'
import { Bloco, Lista, Convite, Acoes, Aceitar, Recusar, Vencido } from './styles'

/**
 * Os convites de time em aberto do jogador (#218).
 *
 * Fica no topo de "Meus Times", e não numa rota própria, porque é para lá que a
 * pessoa vai depois da notificação — e um convite que exige procurar uma
 * segunda tela é um convite que morre.
 *
 * **O vencido aparece marcado, e não some.** A api manda `expired` calculado
 * por ela; comparar `expiresAt` com o relógio do navegador faria um aparelho
 * com a hora errada oferecer "Aceitar" num convite que a api recusa.
 */
export default function ConvitesDeTime() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: convites } = useQuery({
    queryKey: chaves.times.convites(),
    queryFn: teamsService.meusConvites,
  })

  /**
   * As duas respostas invalidam as mesmas entradas, e por isso dividem o
   * `onSettled`: aceitar entra num time novo (muda a lista) e recusar tira o
   * convite da lista de convites. Errar uma das duas deixaria a tela mostrando
   * um convite que já não existe.
   */
  const aoResponder = () => {
    queryClient.invalidateQueries({ queryKey: chaves.times.convites() })
    queryClient.invalidateQueries({ queryKey: chaves.times.meus() })
  }

  const aceitar = useMutation({
    mutationFn: (convite: TeamInvite) => teamsService.aceitarConvite(convite.id),
    onSuccess: (_resposta, convite) => {
      aoResponder()
      toast.success(`Você entrou no ${convite.team.name}!`)
      // Levar para o time é o fim natural do convite: a pessoa aceitou para
      // ver quem está lá, não para voltar à lista.
      navigate(`/times/${convite.teamId}`)
    },
    onError: (err: unknown) => {
      aoResponder()
      toast.error(mensagemDeErro(err))
    },
  })

  const recusar = useMutation({
    mutationFn: (convite: TeamInvite) => teamsService.recusarConvite(convite.id),
    onSuccess: (_resposta, convite) => {
      aoResponder()
      toast.success(`Convite do ${convite.team.name} recusado.`)
    },
    onError: (err: unknown) => {
      aoResponder()
      toast.error(mensagemDeErro(err))
    },
  })

  // Sem convite não há bloco: um cabeçalho "Convites" sobre o vazio ocuparia a
  // primeira dobra da tela para dizer que não há nada.
  if (!convites || convites.length === 0) return null

  const respondendo = aceitar.isPending || recusar.isPending

  return (
    <Bloco aria-labelledby="titulo-convites">
      <h2 id="titulo-convites">
        {convites.length === 1 ? 'Você tem um convite' : `Você tem ${convites.length} convites`}
      </h2>

      <Lista>
        {convites.map((convite) => {
          const modalidade = getSportMeta(convite.team.sport)

          return (
            <Convite key={convite.id} $vencido={convite.expired}>
              <div className="texto">
                <div className="titulo">
                  {convite.invitedBy.name} chamou você para o {convite.team.name}
                </div>
                <div className="detalhe">
                  <span aria-hidden="true">{modalidade.icon}</span> {modalidade.label} · {convite.team.city}
                </div>
              </div>

              {convite.expired ? (
                <Vencido>
                  <Clock size={12} aria-hidden="true" />
                  Convite expirado
                </Vencido>
              ) : (
                <Acoes>
                  <Recusar
                    type="button"
                    disabled={respondendo}
                    onClick={() => recusar.mutate(convite)}
                  >
                    <X size={16} aria-hidden="true" />
                    Recusar
                  </Recusar>
                  <Aceitar
                    type="button"
                    disabled={respondendo}
                    onClick={() => aceitar.mutate(convite)}
                  >
                    <Check size={16} aria-hidden="true" />
                    Aceitar
                  </Aceitar>
                </Acoes>
              )}
            </Convite>
          )
        })}
      </Lista>
    </Bloco>
  )
}
