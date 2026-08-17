import { useState, useEffect } from 'react'
import { usePageHeader, PageActions } from '../../../components/DashboardLayout/pageHeader'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toastErroDeApi } from '../../../utils/toastErro'
import { mensagemDeErro } from '../../../utils/apiError'
import StatCard from '../../../components/StatCard'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { useSubscription } from '../../../hooks/useSubscription'
import * as placeRequestsService from '../../../services/placeRequests'
import type { PlaceRequest } from '../../../types/api'
import type { PlaceRequestInput } from '../../../services/placeRequests'
import {
  StatsRow, RequestList, RequestCard, RequestAccent, RequestHeader,
  RequestTitle, RequestMeta, RequestFooter, RequestSentAt,
  StatusBadge, EmptyState, ErrorMsg,
  NewBtn, Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle,
  Form, FormGroup, FormRow, Label, Input, ModalActions, CancelBtn, SubmitBtn,
  FieldError,
} from './styles'

const STATUS_LABEL = { PENDING: 'Aguardando', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }
const STATUS_COLOR = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2' }

/**
 * Espelha o `createPlaceRequestSchema` da API, campo a campo.
 *
 * Precisa continuar espelhando: o `validate` da API roda com `stripUnknown`,
 * então campo que não existe lá é descartado em silêncio e volta 422 sem dizer
 * qual. Foi assim que este formulário nasceu quebrado — pedia `placeName`,
 * `address` e `description`, o corpo enviado se reduzia a `{ city }`, e o dono
 * só via um erro genérico. Ver #250.
 *
 * Por isso também não há campo de descrição: a API não tem onde guardá-lo, e um
 * campo que o usuário preenche para nada é a mesma armadilha de novo.
 *
 * `latitude` e `longitude` são opcionais lá e ficam fora daqui de propósito —
 * o épico de geolocalização (so-mais-um-api#212 a #218) prevê preenchê-las
 * automaticamente no cadastro e na aprovação.
 */
const schema = yup.object({
  name:         yup.string().trim().min(2, 'Nome muito curto').required('Nome obrigatório'),
  // `excludeEmptyString` para que o campo vazio caia em "CEP obrigatório", e não
  // na regra de formato — quem não digitou nada não errou o formato.
  zipCode:      yup.string().trim()
    .matches(/^\d{5}-?\d{3}$/, { message: 'CEP no formato 00000-000', excludeEmptyString: true })
    .required('CEP obrigatório'),
  street:       yup.string().trim().required('Rua obrigatória'),
  number:       yup.string().trim().required('Número obrigatório'),
  complement:   yup.string().trim().default(''),
  neighborhood: yup.string().trim().required('Bairro obrigatório'),
  city:         yup.string().trim().required('Cidade obrigatória'),
  state:        yup.string().trim().length(2, 'Use a sigla, ex.: MG').required('Estado obrigatório'),
})

type FormularioSolicitacao = yup.InferType<typeof schema>

/**
 * Do que o formulário coleta para o que a API espera.
 *
 * O CEP é gravado com hífen (`37200-430` é o formato de todos os registros
 * existentes) e a sigla do estado em maiúsculas, para que o dado não dependa de
 * como cada dono digitou.
 *
 * `complement` vazio vira `null`, e não `''`: é o que o schema da API espera de
 * um endereço sem complemento — o caso comum, não a exceção (ver o comentário
 * do `complement` em `place-request.schema.ts`).
 */
function paraAApi(dados: FormularioSolicitacao): PlaceRequestInput {
  const digitos = dados.zipCode.replace(/\D/g, '')

  return {
    name:         dados.name,
    street:       dados.street,
    number:       dados.number,
    complement:   dados.complement || null,
    neighborhood: dados.neighborhood,
    city:         dados.city,
    state:        dados.state.toUpperCase(),
    zipCode:      `${digitos.slice(0, 5)}-${digitos.slice(5)}`,
  }
}

export default function OwnerRequests() {
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()
  const [requests, setRequests]   = useState<PlaceRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placeRequestsService.listMine()
      setRequests(res.data.data)
    } catch {
      setError('Não foi possível carregar suas solicitações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const onSubmit = async (data: FormularioSolicitacao) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await placeRequestsService.create(paraAApi(data))
      reset()
      setShowModal(false)
      await fetchRequests()
    } catch (err) {
      // O toast some sozinho; a mensagem da API — que diz qual campo falhou —
      // fica no modal até o dono corrigir e reenviar.
      setFormError(mensagemDeErro(err, 'Erro ao enviar solicitação.'))
      toastErroDeApi(err, 'Erro ao enviar solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  const fecharModal = () => {
    setShowModal(false)
    setFormError(null)
    reset()
  }

  const counts = {
    total:    requests.length,
    pending:  requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }

  usePageHeader("Minhas Solicitações", "Acompanhe o status das suas solicitações de cadastro de estabelecimentos")

  return (
    <>
      {/* Ficava clicável com a assinatura vencida, porque mora fora do
          portão: o conteúdo abaixo era apagado e este botão não. */}
      <PageActions>
        <NewBtn onClick={() => setShowModal(true)} disabled={!podeAlterar}>+ Nova Solicitação</NewBtn>
      </PageActions>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
      <StatsRow>
        <StatCard label="Total Enviadas" value={counts.total}    accent="#3b82f6" />
        <StatCard label="Aprovadas"      value={counts.approved} accent="#22c55e" />
        <StatCard label="Pendentes"      value={counts.pending}  accent="#f59e0b" />
        <StatCard label="Rejeitadas"     value={counts.rejected} accent="#ef4444" />
      </StatsRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && requests.length === 0 && !error && (
        <EmptyState>
          Você ainda não enviou nenhuma solicitação.
          <br />
          Clique em <strong>+ Nova Solicitação</strong> para começar.
        </EmptyState>
      )}

      <RequestList>
        {requests.map((req) => (
          <RequestCard key={req.id}>
            <RequestAccent color={STATUS_COLOR[req.status]} />

            <RequestHeader>
              <div>
                <RequestTitle>{req.name ?? 'Estabelecimento'}</RequestTitle>
                <RequestMeta>
                  {/*
                    * `req.address` não existe: a API devolve o endereço em
                    * campos separados (street, number, neighborhood). O bloco
                    * anterior nunca renderizava nada.
                    */}
                  {req.city}
                  {req.street && ` · ${req.street}, ${req.number}`}
                </RequestMeta>
              </div>
              <StatusBadge bg={STATUS_BG[req.status]} color={STATUS_COLOR[req.status]}>
                {STATUS_LABEL[req.status]}
              </StatusBadge>
            </RequestHeader>

            {/*
              * Era `req.rejectionReason` — campo inexistente na API, que grava
              * a justificativa em `adminNote`. O motivo da recusa nunca era
              * exibido ao owner. (O envio também estava errado: ver a correção
              * em services/placeRequests.reject.)
              */}
            {req.status === 'REJECTED' && req.adminNote && (
              <RequestMeta style={{ color: '#b91c1c' }}>
                Motivo: {req.adminNote}
              </RequestMeta>
            )}

            <RequestFooter>
              <RequestSentAt>
                Enviada em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
              </RequestSentAt>
              {req.status === 'APPROVED' && (
                <RequestMeta style={{ color: '#16a34a', fontWeight: 600 }}>
                  ✓ Disponível em Meus Estabelecimentos
                </RequestMeta>
              )}
              {req.status === 'PENDING' && (
                <RequestMeta style={{ color: '#d97706' }}>
                  ⏳ Em análise pelo Admin
                </RequestMeta>
              )}
            </RequestFooter>
          </RequestCard>
        ))}
      </RequestList>

      {showModal && (
        <Modal>
          <ModalOverlay onClick={fecharModal} />
          <ModalBox>
            <ModalHeader>
              <ModalTitle>Nova Solicitação de Estabelecimento</ModalTitle>
            </ModalHeader>

            <Form onSubmit={handleSubmit(onSubmit)}>
              {formError && <ErrorMsg>{formError}</ErrorMsg>}

              {/*
                Cada Label aponta para o id do seu Input. Antes eram irmãos soltos
                dentro do FormGroup: visualmente pareciam ligados, mas o navegador
                e o leitor de tela não sabiam disso — clicar no rótulo não focava
                o campo, e o campo era anunciado sem nome.
              */}
              <FormGroup>
                <Label htmlFor="solicitacao-nome">Nome do Estabelecimento *</Label>
                <Input id="solicitacao-nome" {...register('name')} placeholder="Ex.: Arena Verde Futebol" />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="solicitacao-cep">CEP *</Label>
                <Input id="solicitacao-cep" {...register('zipCode')} placeholder="00000-000" inputMode="numeric" />
                {errors.zipCode && <FieldError>{errors.zipCode.message}</FieldError>}
              </FormGroup>

              <FormRow $proporcao="3fr 1fr">
                <FormGroup>
                  <Label htmlFor="solicitacao-rua">Rua *</Label>
                  <Input id="solicitacao-rua" {...register('street')} placeholder="Ex.: Av. Brasil" />
                  {errors.street && <FieldError>{errors.street.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="solicitacao-numero">Número *</Label>
                  <Input id="solicitacao-numero" {...register('number')} placeholder="123" />
                  {errors.number && <FieldError>{errors.number.message}</FieldError>}
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="solicitacao-complemento">Complemento</Label>
                <Input id="solicitacao-complemento" {...register('complement')} placeholder="Ex.: quadra 2, fundos" />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="solicitacao-bairro">Bairro *</Label>
                <Input id="solicitacao-bairro" {...register('neighborhood')} placeholder="Ex.: Centro" />
                {errors.neighborhood && <FieldError>{errors.neighborhood.message}</FieldError>}
              </FormGroup>

              <FormRow $proporcao="3fr 1fr">
                <FormGroup>
                  <Label htmlFor="solicitacao-cidade">Cidade *</Label>
                  <Input id="solicitacao-cidade" {...register('city')} placeholder="Ex.: Lavras" />
                  {errors.city && <FieldError>{errors.city.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="solicitacao-uf">UF *</Label>
                  <Input id="solicitacao-uf" {...register('state')} placeholder="MG" maxLength={2} />
                  {errors.state && <FieldError>{errors.state.message}</FieldError>}
                </FormGroup>
              </FormRow>

              <ModalActions>
                <CancelBtn type="button" onClick={fecharModal}>
                  Cancelar
                </CancelBtn>
                <SubmitBtn type="submit" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                </SubmitBtn>
              </ModalActions>
            </Form>
          </ModalBox>
        </Modal>
      )}
      </SubscriptionGate>
    </>
  )
}
