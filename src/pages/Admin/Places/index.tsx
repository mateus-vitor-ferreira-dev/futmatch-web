import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../../components/DashboardLayout'
import { adminNavItems } from '../../../constants/navItems'
import StatCard from '../../../components/StatCard'
import { useAuth } from '../../../contexts/AuthContext'
import * as placesService from '../../../services/places'
import * as adminService from '../../../services/admin'
import type { Place } from '../../../types/api'
import type { AdminUser } from '../../../services/admin'
import {
  StatsRow, Table, Th, Tr, Td, OwnerCell, NoOwner,
  StatusBadge, ActionGroup, ActionBtn,
  EmptyState, ErrorMsg,
  Modal, ModalOverlay, ModalBox, ModalTitle,
  ModalActions, CancelBtn, ConfirmBtn,
  Select, OwnerOption,
  PromoteLink, PromoteBox, PromoteBtn,
} from './styles'

const STATUS_LABEL = { OPEN: 'Aberto', CLOSED: 'Fechado' }
const STATUS_COLOR = { OPEN: '#16a34a', CLOSED: '#6b7280' }
const STATUS_BG    = { OPEN: '#dcfce7', CLOSED: '#f3f4f6' }

export default function AdminPlaces() {
  const { user } = useAuth()
  const [places, setPlaces]     = useState<Place[]>([])
  const [owners, setOwners]     = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [togglingId, setTogglingId]   = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Place | null>(null)
  const [selectedOwner, setSelectedOwner] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [promoteMode, setPromoteMode] = useState(false)
  const [allUsers, setAllUsers]       = useState<AdminUser[]>([])
  const [selectedPromote, setSelectedPromote] = useState('')
  const [promoting, setPromoting] = useState(false)

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placesService.list()
      setPlaces(res.data.data)
    } catch {
      setError('Não foi possível carregar os estabelecimentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOwners = useCallback(async () => {
    try {
      const res = await adminService.listUsers('OWNER')
      setOwners(res.data.data)
    } catch {
      // silencioso — owners são carregados só quando o modal abre
    }
  }, [])

  useEffect(() => { fetchPlaces() }, [fetchPlaces])

  const handleToggleStatus = async (place: Place) => {
    const next = place.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setTogglingId(place.id)
    try {
      await placesService.updateStatus(place.id, next)
      await fetchPlaces()
    } catch {
      toast.error('Erro ao alterar status.')
    } finally {
      setTogglingId(null)
    }
  }

  const openAssignModal = async (place: Place) => {
    setAssignTarget(place)
    setSelectedOwner(place.ownerId ?? '')
    setPromoteMode(false)
    setSelectedPromote('')
    await fetchOwners()
  }

  const openPromoteMode = async () => {
    setPromoteMode(true)
    if (allUsers.length === 0) {
      try {
        const res = await adminService.listUsers()
        setAllUsers(res.data.data.filter((u: AdminUser) => u.role !== 'OWNER' && u.role !== 'ADMIN'))
      } catch {
        // silencioso
      }
    }
  }

  const handlePromoteAndAssign = async () => {
    if (!assignTarget || !selectedPromote) return
    setPromoting(true)
    try {
      await adminService.updateUserRole(selectedPromote, 'OWNER')
      await placesService.assignOwner(assignTarget.id, selectedPromote)
      setAssignTarget(null)
      setSelectedOwner('')
      setPromoteMode(false)
      setSelectedPromote('')
      setAllUsers([])
      await fetchPlaces()
    } catch {
      toast.error('Erro ao promover e atribuir proprietário.')
    } finally {
      setPromoting(false)
    }
  }

  const handleAssignOwner = async () => {
    if (!assignTarget || !selectedOwner) return
    setAssigning(true)
    try {
      await placesService.assignOwner(assignTarget.id, selectedOwner)
      setAssignTarget(null)
      setSelectedOwner('')
      await fetchPlaces()
    } catch {
      toast.error('Erro ao atribuir proprietário.')
    } finally {
      setAssigning(false)
    }
  }

  const counts = {
    total:  places.length,
    open:   places.filter((p) => p.status === 'OPEN').length,
    closed: places.filter((p) => p.status === 'CLOSED').length,
    noOwner: places.filter((p) => !p.ownerId).length,
  }

  return (
    <DashboardLayout
      user={user}
      navItems={adminNavItems}
      tagline="Admin Panel"
      accent="#16a34a"
      pageTitle="Estabelecimentos"
      pageSub="Gerencie todos os estabelecimentos da plataforma e atribua proprietários"
    >
      <StatsRow>
        <StatCard label="Total"           value={counts.total}   accent="#3b82f6" />
        <StatCard label="Abertos"         value={counts.open}    accent="#22c55e" />
        <StatCard label="Fechados"        value={counts.closed}  accent="#6b7280" />
        <StatCard label="Sem Proprietário" value={counts.noOwner} accent="#f59e0b" />
      </StatsRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && places.length === 0 && !error && (
        <EmptyState>Nenhum estabelecimento cadastrado.</EmptyState>
      )}

      {places.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Cidade</Th>
              <Th>Proprietário</Th>
              <Th center>Quadras</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {places.map((place: Place) => (
              <Tr key={place.id}>
                <Td><strong>{place.name}</strong></Td>
                <Td>{place.city}, {place.state}</Td>
                <Td>
                  {place.owner
                    ? <OwnerCell>{place.owner.name}</OwnerCell>
                    : <NoOwner>Sem proprietário</NoOwner>
                  }
                </Td>
                <Td center>{place._count?.courts ?? 0}</Td>
                <Td>
                  <StatusBadge bg={STATUS_BG[place.status]} color={STATUS_COLOR[place.status]}>
                    {STATUS_LABEL[place.status]}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionGroup>
                    <ActionBtn
                      variant={place.status === 'OPEN' ? 'danger' : 'success'}
                      onClick={() => handleToggleStatus(place)}
                      disabled={togglingId === place.id}
                    >
                      {togglingId === place.id
                        ? '...'
                        : place.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                    </ActionBtn>
                    <ActionBtn variant="secondary" onClick={() => openAssignModal(place)}>
                      {place.ownerId ? 'Trocar Owner' : 'Atribuir Owner'}
                    </ActionBtn>
                  </ActionGroup>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {assignTarget && (
        <Modal>
          <ModalOverlay onClick={() => setAssignTarget(null)} />
          <ModalBox>
            <ModalTitle>
              {assignTarget.ownerId ? 'Trocar Proprietário' : 'Atribuir Proprietário'}
            </ModalTitle>
            <p>{assignTarget.name}</p>

            <Select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
            >
              <option value="" disabled>Selecione um Owner...</option>
              {owners.map((o) => (
                <OwnerOption key={o.id} value={o.id}>
                  {o.name} — {o.email}
                </OwnerOption>
              ))}
            </Select>

            {!promoteMode && (
              <PromoteLink onClick={openPromoteMode}>
                Usuário não tem role Owner ainda? Promover aqui →
              </PromoteLink>
            )}

            {promoteMode && (
              <PromoteBox>
                <label>Promover jogador para Owner</label>
                <Select
                  value={selectedPromote}
                  onChange={(e) => setSelectedPromote(e.target.value)}
                >
                  <option value="" disabled>Selecione um usuário...</option>
                  {allUsers.map((u: AdminUser) => (
                    <OwnerOption key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.role})
                    </OwnerOption>
                  ))}
                </Select>
                <PromoteBtn
                  onClick={handlePromoteAndAssign}
                  disabled={!selectedPromote || promoting}
                >
                  {promoting ? 'Promovendo...' : 'Promover e Atribuir'}
                </PromoteBtn>
              </PromoteBox>
            )}

            <ModalActions>
              <CancelBtn onClick={() => setAssignTarget(null)}>Cancelar</CancelBtn>
              <ConfirmBtn
                onClick={handleAssignOwner}
                disabled={!selectedOwner || assigning}
              >
                {assigning ? 'Salvando...' : 'Confirmar'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
    </DashboardLayout>
  )
}
