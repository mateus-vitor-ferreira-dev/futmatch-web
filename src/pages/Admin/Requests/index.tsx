import { useState, useEffect, useCallback } from 'react'
import { usePageHeader, useNavBadge } from '../../../components/DashboardLayout/pageHeader'
import { toast } from 'sonner'
import StatCard from '../../../components/StatCard'
import * as placeRequestsService from '../../../services/placeRequests'
import type { PlaceRequest, PlaceRequestStatus } from '../../../types/api'
import {
  StatsRow, Tabs, Tab, RequestList, RequestCard, RequestAccent,
  RequestHeader, RequestTitle, RequestMeta,
  RequestFooter, RequestSentAt, StatusBadge, ActionGroup,
  ApproveBtn, RejectBtn, EmptyState, ErrorMsg, RejectModal, ModalOverlay,
  ModalBox, ModalTitle, ReasonInput, ModalActions, CancelBtn, ConfirmBtn,
} from './styles'

const STATUS_TABS: Array<{ key: PlaceRequestStatus | undefined; label: string }> = [
  { key: undefined,    label: 'Todas'      },
  { key: 'PENDING',    label: 'Pendentes'  },
  { key: 'APPROVED',   label: 'Aprovadas'  },
  { key: 'REJECTED',   label: 'Rejeitadas' },
]

const STATUS_LABEL = { PENDING: 'Pendente', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }
const STATUS_COLOR = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2' }

export default function AdminRequests() {
  const [requests, setRequests]   = useState<PlaceRequest[]>([])
  const [tab, setTab] = useState<PlaceRequestStatus | undefined>(undefined)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [actionId, setActionId]   = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PlaceRequest | null>(null)
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

  const handleApprove = async (id: string) => {
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

  usePageHeader("Solicitações de Estabelecimento", "Aprove ou rejeite solicitações de Owners para cadastro de novos estabelecimentos")
  // Contagem de pendentes no item do menu — só enquanto esta página está
  // aberta, como era antes de o layout virar rota-pai.
  useNavBadge('/admin/requests', pendingCount)

  return (
    <>
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
                {/*
                  * `placeName`, `ownerName` e `ownerEmail` não existem no
                  * retorno da API — eram fallbacks mortos, e os campos reais
                  * (name, owner.name, owner.email) já vinham primeiro.
                  */}
                <RequestTitle>{req.name ?? 'Estabelecimento'}</RequestTitle>
                <RequestMeta>
                  Owner: <strong>{req.owner?.name ?? '—'}</strong>
                  {' · '}
                  {req.owner?.email ?? '—'}
                </RequestMeta>
              </div>
              <StatusBadge bg={STATUS_BG[req.status]} color={STATUS_COLOR[req.status]}>
                {STATUS_LABEL[req.status]}
              </StatusBadge>
            </RequestHeader>

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
    </>
  )
}
