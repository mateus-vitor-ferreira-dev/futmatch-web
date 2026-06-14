import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Users, ClipboardList, Building2, LayoutDashboard, Home, Store } from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import StatCard from '../../../components/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
import * as placeRequestsService from '../../../services/placeRequests'
import {
  StatsRow, Tabs, Tab, RequestList, RequestCard, RequestAccent,
  RequestHeader, RequestTitle, RequestMeta, RequestDesc,
  RequestFooter, RequestSentAt, StatusBadge, ActionGroup,
  ApproveBtn, RejectBtn, EmptyState, ErrorMsg, RejectModal, ModalOverlay,
  ModalBox, ModalTitle, ReasonInput, ModalActions, CancelBtn, ConfirmBtn,
} from './styles'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',          label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',           label: 'Área do Jogador',    icon: Home },
]

const STATUS_TABS = [
  { key: undefined,    label: 'Todas'      },
  { key: 'PENDING',    label: 'Pendentes'  },
  { key: 'APPROVED',   label: 'Aprovadas'  },
  { key: 'REJECTED',   label: 'Rejeitadas' },
]

const STATUS_LABEL = { PENDING: 'Pendente', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }
const STATUS_COLOR = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2' }

export default function AdminRequests() {
  const { user } = useAuth()
  const [requests, setRequests]   = useState([])
  const [tab, setTab]             = useState(undefined)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [actionId, setActionId]   = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placeRequestsService.listAll(tab)
      setRequests(res.data.data)
    } catch {
      setError('Não foi possível carregar as solicitações.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await placeRequestsService.approve(id)
      await fetchRequests()
    } catch {
      toast.error('Erro ao aprovar solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    setActionId(rejectTarget.id)
    try {
      await placeRequestsService.reject(rejectTarget.id, rejectReason)
      setRejectTarget(null)
      setRejectReason('')
      await fetchRequests()
    } catch {
      toast.error('Erro ao rejeitar solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const counts = {
    total:    requests.length,
    pending:  requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <DashboardLayout
      user={user}
      navItems={NAV_ITEMS.map((n) =>
        n.to === '/admin/requests' ? { ...n, badge: pendingCount } : n
      )}
      tagline="Admin Panel"
      accent="#16a34a"
      pageTitle="Solicitações de Estabelecimento"
      pageSub="Aprove ou rejeite solicitações de Owners para cadastro de novos estabelecimentos"
    >
      <StatsRow>
        <StatCard label="Total"      value={counts.total}    accent="#3b82f6" />
        <StatCard label="Pendentes"  value={counts.pending}  accent="#f59e0b" />
        <StatCard label="Aprovadas"  value={counts.approved} accent="#22c55e" />
        <StatCard label="Rejeitadas" value={counts.rejected} accent="#ef4444" />
      </StatsRow>

      <Tabs>
        {STATUS_TABS.map(({ key, label }) => (
          <Tab key={String(key)} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </Tab>
        ))}
      </Tabs>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && requests.length === 0 && !error && (
        <EmptyState>Nenhuma solicitação encontrada.</EmptyState>
      )}

      <RequestList>
        {requests.map((req) => (
          <RequestCard key={req.id}>
            <RequestAccent color={STATUS_COLOR[req.status]} />

            <RequestHeader>
              <div>
                <RequestTitle>{req.placeName ?? req.name ?? 'Estabelecimento'}</RequestTitle>
                <RequestMeta>
                  Owner: <strong>{req.owner?.name ?? req.ownerName ?? '—'}</strong>
                  {' · '}
                  {req.owner?.email ?? req.ownerEmail ?? '—'}
                </RequestMeta>
              </div>
              <StatusBadge bg={STATUS_BG[req.status]} color={STATUS_COLOR[req.status]}>
                {STATUS_LABEL[req.status]}
              </StatusBadge>
            </RequestHeader>

            {req.description && <RequestDesc>{req.description}</RequestDesc>}

            <RequestFooter>
              <RequestSentAt>
                Enviada em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
              </RequestSentAt>

              {req.status === 'PENDING' && (
                <ActionGroup>
                  <ApproveBtn
                    onClick={() => handleApprove(req.id)}
                    disabled={actionId === req.id}
                  >
                    ✓ Aprovar
                  </ApproveBtn>
                  <RejectBtn
                    onClick={() => setRejectTarget(req)}
                    disabled={actionId === req.id}
                  >
                    ✕ Rejeitar
                  </RejectBtn>
                </ActionGroup>
              )}
            </RequestFooter>
          </RequestCard>
        ))}
      </RequestList>

      {rejectTarget && (
        <RejectModal>
          <ModalOverlay onClick={() => setRejectTarget(null)} />
          <ModalBox>
            <ModalTitle>Rejeitar Solicitação</ModalTitle>
            <p>Informe o motivo da rejeição (opcional):</p>
            <ReasonInput
              placeholder="Ex.: Documentação incompleta..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <ModalActions>
              <CancelBtn onClick={() => { setRejectTarget(null); setRejectReason('') }}>
                Cancelar
              </CancelBtn>
              <ConfirmBtn onClick={handleRejectConfirm} disabled={actionId === rejectTarget.id}>
                {actionId === rejectTarget.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </RejectModal>
      )}
    </DashboardLayout>
  )
}
