import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import DashboardLayout from '../../../components/DashboardLayout'
import { ownerNavItems } from '../../../constants/navItems'
import StatCard from '../../../components/StatCard'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { useAuth } from '../../../contexts/AuthContext'
import { useSubscription } from '../../../hooks/useSubscription'
import * as placeRequestsService from '../../../services/placeRequests'
import type { PlaceRequest } from '../../../types/api'
import type { PlaceRequestInput } from '../../../services/placeRequests'
import {
  StatsRow, RequestList, RequestCard, RequestAccent, RequestHeader,
  RequestTitle, RequestMeta, RequestFooter, RequestSentAt,
  StatusBadge, EmptyState, ErrorMsg,
  NewBtn, Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle,
  Form, FormGroup, Label, Input, Textarea, ModalActions, CancelBtn, SubmitBtn,
  FieldError,
} from './styles'

const STATUS_LABEL = { PENDING: 'Aguardando', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }
const STATUS_COLOR = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2' }

/**
 * ⚠️ BUG CONHECIDO — este formulário nunca funcionou.
 *
 * Os campos abaixo (placeName, address, description) não correspondem ao
 * createPlaceRequestSchema da API, que exige name, street, number,
 * neighborhood, city, state e zipCode. Como o validate middleware roda com
 * stripUnknown, o corpo enviado se reduz a { city } e a requisição sempre
 * volta 422 com seis campos obrigatórios faltando — o owner só vê o toast
 * genérico "Erro ao enviar solicitação.".
 *
 * Corrigir exige reescrever o formulário com os campos certos, o que é
 * mudança de UI e ficou fora da migração para TypeScript.
 */
const schema = yup.object({
  placeName:   yup.string().required('Nome obrigatório'),
  city:        yup.string().required('Cidade obrigatória'),
  address:     yup.string().required('Endereço obrigatório'),
  description: yup.string(),
})

type FormularioSolicitacao = yup.InferType<typeof schema>

export default function OwnerRequests() {
  const { user } = useAuth()
  const { isActive, loading: subLoading } = useSubscription()
  const [requests, setRequests]   = useState<PlaceRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    try {
      await placeRequestsService.create(data as unknown as PlaceRequestInput)
      reset()
      setShowModal(false)
      await fetchRequests()
    } catch {
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  const counts = {
    total:    requests.length,
    pending:  requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }

  return (
    <DashboardLayout
      user={user}
      navItems={ownerNavItems(user?.role)}
      tagline="Owner Panel"
      accent="#f59e0b"
      pageTitle="Minhas Solicitações"
      pageSub="Acompanhe o status das suas solicitações de cadastro de estabelecimentos"
      topbarActions={
        <NewBtn onClick={() => setShowModal(true)}>+ Nova Solicitação</NewBtn>
      }
    >
      <SubscriptionGate isActive={isActive} loading={subLoading}>
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
          <ModalOverlay onClick={() => { setShowModal(false); reset() }} />
          <ModalBox>
            <ModalHeader>
              <ModalTitle>Nova Solicitação de Estabelecimento</ModalTitle>
            </ModalHeader>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>Nome do Estabelecimento *</Label>
                <Input {...register('placeName')} placeholder="Ex.: Arena Verde Futebol" />
                {errors.placeName && <FieldError>{errors.placeName.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label>Cidade / Estado *</Label>
                <Input {...register('city')} placeholder="Ex.: São Paulo, SP" />
                {errors.city && <FieldError>{errors.city.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label>Endereço *</Label>
                <Input {...register('address')} placeholder="Rua, número, bairro" />
                {errors.address && <FieldError>{errors.address.message}</FieldError>}
              </FormGroup>

              <FormGroup>
                <Label>Descrição / Observações</Label>
                <Textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Informe diferenciais, estrutura e serviços disponíveis..."
                />
              </FormGroup>

              <ModalActions>
                <CancelBtn type="button" onClick={() => { setShowModal(false); reset() }}>
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
    </DashboardLayout>
  )
}
