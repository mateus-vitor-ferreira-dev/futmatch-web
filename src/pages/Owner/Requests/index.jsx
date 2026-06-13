import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { Building2, ClipboardList, LayoutDashboard, Home } from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import StatCard from '../../../components/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
import * as placeRequestsService from '../../../services/placeRequests'
import {
  StatsRow, RequestList, RequestCard, RequestAccent, RequestHeader,
  RequestTitle, RequestMeta, RequestDesc, RequestFooter, RequestSentAt,
  StatusBadge, EmptyState, ErrorMsg,
  NewBtn, Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle,
  Form, FormGroup, Label, Input, Textarea, ModalActions, CancelBtn, SubmitBtn,
  FieldError,
} from './styles'

const NAV_ITEMS = [
  { to: '/owner',          label: 'Visão Geral',           icon: LayoutDashboard },
  { to: '/owner/places',   label: 'Meus Estabelecimentos', icon: Building2       },
  { to: '/owner/requests', label: 'Solicitações',          icon: ClipboardList   },
  { to: '/home',           label: 'Área do Jogador',       icon: Home, divider: true },
]

const STATUS_LABEL = { PENDING: 'Aguardando', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }
const STATUS_COLOR = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2' }

const schema = yup.object({
  placeName:   yup.string().required('Nome obrigatório'),
  city:        yup.string().required('Cidade obrigatória'),
  address:     yup.string().required('Endereço obrigatório'),
  description: yup.string(),
})

export default function OwnerRequests() {
  const { user } = useAuth()
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
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

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await placeRequestsService.create(data)
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
      navItems={NAV_ITEMS}
      tagline="Owner Panel"
      accent="#f59e0b"
      pageTitle="Minhas Solicitações"
      pageSub="Acompanhe o status das suas solicitações de cadastro de estabelecimentos"
      topbarActions={
        <NewBtn onClick={() => setShowModal(true)}>+ Nova Solicitação</NewBtn>
      }
    >
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
                <RequestTitle>{req.placeName ?? req.name ?? 'Estabelecimento'}</RequestTitle>
                <RequestMeta>
                  {req.city && `${req.city}`}
                  {req.address && ` · ${req.address}`}
                </RequestMeta>
              </div>
              <StatusBadge bg={STATUS_BG[req.status]} color={STATUS_COLOR[req.status]}>
                {STATUS_LABEL[req.status]}
              </StatusBadge>
            </RequestHeader>

            {req.description && <RequestDesc>{req.description}</RequestDesc>}

            {req.status === 'REJECTED' && req.rejectionReason && (
              <RequestMeta style={{ color: '#b91c1c' }}>
                Motivo: {req.rejectionReason}
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
    </DashboardLayout>
  )
}
