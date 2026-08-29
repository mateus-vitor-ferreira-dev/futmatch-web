import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { ArrowLeft, Send } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { professoresService } from '../../../services/professores'
import * as placesService from '../../../services/places'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { ConviteDeProfessor } from '../../../types/api'
import {
  BackBtn, Caixa, CampoEmail, Convidar, Email, Erro, ErroDoCampo, Explicacao,
  Form, Input, Item, Lista, Quando, Ressalva, Selo, TituloDaCaixa, Vazio,
} from './styles'

const schema = yup.object({
  email: yup.string().trim().email('E-mail inválido').required('Informe o e-mail do professor'),
})

type Formulario = yup.InferType<typeof schema>

const data = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Como cada convite aparece — e `vencido` não é um `status`.
 *
 * O banco só guarda os quatro do enum. "Pendente e vencido" é um `PENDING` com
 * o prazo no passado, que o serviço trata em tempo de leitura e recusa como se
 * não existisse. Se a tela não o separasse, o dono veria "pendente" para sempre
 * num convite que ninguém mais consegue aceitar.
 */
function estadoDoConvite(convite: ConviteDeProfessor) {
  if (convite.status === 'ACCEPTED') return { tom: 'aceito' as const, texto: 'Aceito' }
  if (convite.status === 'DECLINED') return { tom: 'recusado' as const, texto: 'Recusado' }
  if (convite.status === 'EXPIRED') return { tom: 'vencido' as const, texto: 'Expirado' }
  if (new Date(convite.expiresAt) < new Date()) {
    return { tom: 'vencido' as const, texto: 'Venceu sem resposta' }
  }
  return { tom: 'pendente' as const, texto: 'Aguardando resposta' }
}

/**
 * Os convites de professor de um espaço, para o dono (web#377, api#451).
 *
 * ## Isto é o livro de convites, e a tela diz isso
 *
 * A api ainda não lista os `PlaceMember` de um espaço (api#461): existe
 * `GET /places/:placeId/invites` e nada que responda "quem é professor aqui".
 * Um convite `ACCEPTED` é uma boa pista, mas não é a mesma coisa — o
 * `aceitarConvite` faz `upsert` justamente porque o vínculo pode ter nascido
 * por outro caminho, e nenhum desses aparece aqui.
 *
 * A tela poderia chamar os aceitos de "professores" e quase sempre acertaria.
 * Preferi a ressalva escrita: um app que afirma o que não sabe é a mesma classe
 * de erro que a estimativa de alcance evita ao dizer que só conta quem tem
 * endereço salvo.
 *
 * ## Sem `SubscriptionGate`
 *
 * A api deixou esta rota fora do `requireActiveSubscription` de propósito, e a
 * tela acompanha: trancá-la deixaria um dono adimplente de ontem sem conseguir
 * dar acesso a quem já dá aula na quadra dele hoje.
 */
export default function OwnerProfessores() {
  const { placeId = '' } = useParams<{ placeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  usePageHeader('Professores', 'Convide quem dá aula no seu espaço e acompanhe os convites')

  const espaco = useQuery({
    queryKey: chaves.espaco(placeId),
    queryFn: () => placesService.getOne(placeId).then((r) => r.data.data),
    enabled: Boolean(placeId),
  })

  const convites = useQuery({
    queryKey: chaves.convitesDeProfessor(placeId),
    queryFn: () => professoresService.convites(placeId),
    enabled: Boolean(placeId),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Formulario>({
    resolver: yupResolver(schema),
  })

  const convidar = useMutation({
    mutationFn: (dados: Formulario) => professoresService.convidar(placeId, dados.email),
    onSuccess: (convite) => {
      toast.success(`Convite enviado para ${convite.email}.`)
      reset()
      void queryClient.invalidateQueries({ queryKey: chaves.convitesDeProfessor(placeId) })
    },
    onError: (err) => toastErroDeApi(err),
  })

  return (
    <div>
      <BackBtn type="button" onClick={() => navigate('/owner/places')}>
        <ArrowLeft size={16} aria-hidden /> Voltar para os estabelecimentos
      </BackBtn>

      <Caixa>
        <TituloDaCaixa>
          Convidar professor{espaco.data ? ` para ${espaco.data.name}` : ''}
        </TituloDaCaixa>
        <Explicacao>
          O convite vai por e-mail e vale 7 dias. Funciona para quem já joga no Só+1 e para
          quem ainda não tem conta — nesse caso a pessoa se cadastra com o mesmo e-mail e
          o convite continua esperando. O papel vale só dentro deste espaço.
        </Explicacao>

        <Form onSubmit={handleSubmit((dados) => convidar.mutate(dados))} noValidate>
          <CampoEmail>
            <Input
              type="email"
              placeholder="email@doprofessor.com"
              aria-label="E-mail do professor"
              $erro={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && <ErroDoCampo>{errors.email.message}</ErroDoCampo>}
          </CampoEmail>
          <Convidar type="submit" disabled={convidar.isPending}>
            <Send size={16} aria-hidden />
            {convidar.isPending ? 'Enviando…' : 'Convidar'}
          </Convidar>
        </Form>
      </Caixa>

      <Caixa>
        <TituloDaCaixa>Convites enviados</TituloDaCaixa>

        {convites.isPending ? (
          <Lista aria-busy><Skeleton height="60px" /><Skeleton height="60px" /></Lista>
        ) : convites.isError ? (
          <Erro role="alert">Não foi possível carregar os convites.</Erro>
        ) : convites.data.length === 0 ? (
          <Vazio>Nenhum convite ainda. Convide o primeiro professor no campo acima.</Vazio>
        ) : (
          <Lista>
            {convites.data.map((convite) => {
              const estado = estadoDoConvite(convite)
              return (
                <Item key={convite.id}>
                  <Email>
                    {convite.email}
                    <Quando>
                      {convite.respondedAt
                        ? `respondeu em ${data(convite.respondedAt)}`
                        : `enviado em ${data(convite.createdAt)} · vale até ${data(convite.expiresAt)}`}
                    </Quando>
                  </Email>
                  <Selo $tom={estado.tom}>{estado.texto}</Selo>
                </Item>
              )
            })}
          </Lista>
        )}

        <Ressalva>
          Esta é a lista de convites, e não a de professores: um vínculo criado por outro
          caminho não aparece aqui. A rota que lista quem é professor do espaço ainda não
          existe na api.
        </Ressalva>
      </Caixa>
    </div>
  )
}
