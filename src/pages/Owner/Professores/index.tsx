import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { Copy, Link2, Send } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { useAuth } from '../../../contexts/AuthContext'
import { professoresService } from '../../../services/professores'
import * as placesService from '../../../services/places'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { ConviteDeProfessor, LinkDeConviteDoEspaco, MotivoDoLinkInativo } from '../../../types/api'
import type { Place } from '../../../types/api'
import {
  AvisoDoPortador, Caixa, CampoEmail, CartaoDoLink, Convidar, Copiar, Email, Endereco, Erro,
  ErroDoCampo, Explicacao, Form, Gerar, Input, Item, LinhaDoLink, Lista, Quando, Ressalva,
  Revogar, RodapeDoLink, Selo, SeletorDeEspaco, TituloDaCaixa, Usos, Vazio,
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
 * O que dizer de um link que parou de valer (api#509).
 *
 * **Os três motivos aparecem separados, e é o oposto do que esta tela faz com o
 * convite por e-mail.** Lá, vencido e inexistente dizem a mesma coisa porque a
 * api responde 404 para os dois de propósito — distinguir na tela devolveria o
 * que a api tinha acabado de esconder. Aqui a api **se deu ao trabalho** de
 * separar, porque o que a pessoa faz em seguida é diferente: venceu → gere
 * outro; esgotou → o limite acabou; revogado → você mesmo fechou.
 */
const ESTADO_DO_LINK: Record<MotivoDoLinkInativo, { tom: 'vencido' | 'recusado'; texto: string }> = {
  EXPIRED: { tom: 'vencido', texto: 'Venceu' },
  EXHAUSTED: { tom: 'vencido', texto: 'Limite atingido' },
  REVOKED: { tom: 'recusado', texto: 'Desativado' },
}

/**
 * Quantos usos ainda cabem, em português.
 *
 * `usosRestantes` nulo é **sem limite**, e não zero. Escrever `0` onde a api
 * disse `null` inverteria o significado: diria "acabou" sobre o link que não
 * acaba.
 */
function usosDoLink(link: LinkDeConviteDoEspaco) {
  if (link.usosRestantes === null) return `${link.uses} usos · sem limite`
  return `${link.uses} de ${link.maxUses} usos`
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
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [espacos, setEspacos] = useState<Place[]>([])
  const [placeId, setPlaceId] = useState('')

  usePageHeader('Professores', 'Convide quem dá aula no seu espaço e acompanhe os convites')

  /*
   * O espaço vem do seletor, e não da URL da rota — mesmo desenho do Estoque e
   * dos Equipamentos.
   *
   * A tela era `/owner/places/:placeId/professores`, alcançável só pelo card do
   * estabelecimento. Um item de menu não tem como saber qual espaço, e o dono
   * com dois estabelecimentos escolheria no card e depois não teria como trocar
   * sem voltar. O `?placeId=` mantém o atalho do card funcionando: quem chega
   * por ele já cai no espaço certo.
   */
  useEffect(() => {
    placesService.list().then((resposta) => {
      const meus = user?.role === 'ADMIN'
        ? resposta.data.data
        : resposta.data.data.filter((espaco) => espaco.ownerId === user?.id)
      setEspacos(meus)
      const pedido = searchParams.get('placeId')
      setPlaceId(meus.some((espaco) => espaco.id === pedido) ? pedido! : meus[0]?.id ?? '')
    }).catch(() => setEspacos([]))
  }, [searchParams, user?.id, user?.role])

  const trocarEspaco = (id: string) => {
    setPlaceId(id)
    setSearchParams({ placeId: id })
  }

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

  const links = useQuery({
    queryKey: chaves.linksDoEspaco(placeId),
    queryFn: () => professoresService.links(placeId),
    enabled: Boolean(placeId),
  })

  const invalidarLinks = () =>
    void queryClient.invalidateQueries({ queryKey: chaves.linksDoEspaco(placeId) })

  /**
   * Gera com o padrão da api: um uso, sete dias. Sem formulário.
   *
   * Decisão 2 da #410. O caso comum é o dono que combinou com uma pessoa e quer
   * mandar o link para ela — esse caso não tem escolha nenhuma a fazer, e
   * oferecer "sem limite" com a mesma naturalidade que "um uso" desfaria pela
   * interface a proteção que a api monta por padrão.
   */
  const gerarLink = useMutation({
    mutationFn: () => professoresService.gerarLink(placeId),
    onSuccess: () => {
      toast.success('Link gerado. Ele vale para uma pessoa e por 7 dias.')
      invalidarLinks()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const revogarLink = useMutation({
    mutationFn: (linkId: string) => professoresService.revogarLink(placeId, linkId),
    onSuccess: () => {
      // A frase diz a metade que a pessoa não deduz: fechar a porta não expulsa
      // quem já passou por ela.
      toast.success('Link desativado. Quem já entrou por ele continua professor.')
      invalidarLinks()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const nomeDoEspaco = espacos.find((espaco) => espaco.id === placeId)?.name

  /**
   * Copiar o link do convite (api#509).
   *
   * O `inviteUrl` chegava só na resposta do POST e se perdia na troca de tela.
   * Como o envio do e-mail não bloqueia a criação do convite, *criado* e
   * *entregue* são coisas diferentes — e quando a mensagem não chegava o dono
   * não tinha como recuperar o endereço de um convite que ele mesmo criou.
   *
   * O `catch` não é decoração: navegador nega a área de transferência em
   * contexto não seguro e quando a permissão foi recusada. Aí o endereço
   * continua na tela para selecionar à mão, e é exatamente isso que a mensagem
   * diz — mesmo desenho do `CompartilharPartida`.
   */
  async function copiarLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado! Mande para quem vai dar aula.')
    } catch {
      toast.error('Não foi possível copiar. O link está aí na lista para selecionar.')
    }
  }

  return (
    <div>
      <SeletorDeEspaco
        aria-label="Estabelecimento"
        value={placeId}
        onChange={(evento) => trocarEspaco(evento.target.value)}
      >
        {espacos.length === 0 && <option value="">Nenhum estabelecimento</option>}
        {espacos.map((espaco) => (
          <option key={espaco.id} value={espaco.id}>{espaco.name}</option>
        ))}
      </SeletorDeEspaco>

      <Caixa>
        <TituloDaCaixa>
          Convidar professor{nomeDoEspaco ? ` para ${nomeDoEspaco}` : ''}
        </TituloDaCaixa>
        <Explicacao>
          O convite vai por e-mail e vale 7 dias. Funciona para quem já joga no Só+1 e para
          quem ainda não tem conta — nesse caso a pessoa se cadastra com o mesmo e-mail e
          o convite continua esperando. O papel vale só dentro deste espaço.
          {' '}Se o e-mail não chegar, o link de cada convite pendente fica na lista abaixo,
          pronto para copiar — mas ele só funciona para quem entrar com <strong>esse</strong>{' '}
          e-mail.
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
              // Numa constante para o TypeScript estreitar o nulo sem `!`.
              const link = convite.inviteUrl
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

                  {/* A api devolve `inviteUrl` só enquanto o convite abre a
                      porta. Testar o campo, e não o `estado`, mantém a regra num
                      lugar só: se ela mudar lá, a tela acompanha sem edição. */}
                  {link && (
                    <LinhaDoLink>
                      <Endereco>{link}</Endereco>
                      <Copiar
                        type="button"
                        onClick={() => void copiarLink(link)}
                        aria-label={`Copiar o link do convite de ${convite.email}`}
                      >
                        <Copy size={14} aria-hidden />
                        Copiar link
                      </Copiar>
                    </LinhaDoLink>
                  )}
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

      {/* A terceira forma de convidar, e ela mora ao lado das outras duas
          (decisão 3 da #410). Aba esconderia metade do assunto: quem convida
          por e-mail lê a lista logo acima, e o link é a saída para quando o
          dono não sabe o e-mail da conta. */}
      <Caixa>
        <TituloDaCaixa>Link de convite</TituloDaCaixa>
        <Explicacao>
          Para quando o combinado foi no WhatsApp e você não sabe o e-mail da conta da
          pessoa. Cada link vale para <strong>uma pessoa</strong> e por 7 dias.
        </Explicacao>

        <AvisoDoPortador role="note">
          Diferente do convite por e-mail, <strong>quem tiver o link entra</strong> — ele não
          pergunta quem é. Por isso ele serve a uma pessoa só: depois de usado, não abre mais
          nada. Mande em conversa direta, não em grupo.
        </AvisoDoPortador>

        <Gerar type="button" onClick={() => gerarLink.mutate()} disabled={gerarLink.isPending || !placeId}>
          <Link2 size={16} aria-hidden />
          {gerarLink.isPending ? 'Gerando…' : 'Gerar link'}
        </Gerar>

        {links.isPending ? (
          <Lista aria-busy><Skeleton height="70px" /></Lista>
        ) : links.isError ? (
          <Erro role="alert">Não foi possível carregar os links.</Erro>
        ) : links.data.length === 0 ? (
          <Vazio>Nenhum link ainda. Gere o primeiro no botão acima.</Vazio>
        ) : (
          <Lista>
            {links.data.map((link) => {
              const estado = link.motivo ? ESTADO_DO_LINK[link.motivo] : null
              return (
                <CartaoDoLink key={link.id} $inativo={!link.ativo}>
                  <LinhaDoLink>
                    <Endereco>{link.url}</Endereco>
                    {/* Copiar só faz sentido no que ainda abre a porta. */}
                    {link.ativo && (
                      <Copiar
                        type="button"
                        onClick={() => void copiarLink(link.url)}
                        aria-label={`Copiar o link criado em ${data(link.createdAt)}`}
                      >
                        <Copy size={14} aria-hidden />
                        Copiar link
                      </Copiar>
                    )}
                  </LinhaDoLink>

                  <RodapeDoLink>
                    <Usos>
                      {usosDoLink(link)} · vale até {data(link.expiresAt)}
                    </Usos>
                    {estado ? (
                      <Selo $tom={estado.tom}>{estado.texto}</Selo>
                    ) : (
                      <Revogar
                        type="button"
                        onClick={() => revogarLink.mutate(link.id)}
                        disabled={revogarLink.isPending}
                      >
                        Desativar
                      </Revogar>
                    )}
                  </RodapeDoLink>
                </CartaoDoLink>
              )
            })}
          </Lista>
        )}
      </Caixa>
    </div>
  )
}
