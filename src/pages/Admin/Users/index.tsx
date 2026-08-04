import type { FormEvent } from 'react'
import type { UserRole } from '../../../types/api'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Users, ClipboardList, Building2, LayoutDashboard, Home, Store, Mail } from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import StatCard from '../../../components/StatCard'
import RoleBadge from '../../../components/RoleBadge'
import { useAuth } from '../../../contexts/AuthContext'
import * as adminService from '../../../services/admin'
import type { AdminUser, InviteResult } from '../../../services/admin'
import { mensagemDeErro } from '../../../utils/apiError'
import {
  StatsRow, FilterBar, SearchInput, RoleFilters, RoleBtn,
  Table, Th, Tr, Td, AvatarCell, UserMeta, UserEmail,
  ActionBtn, EmptyState, ErrorMsg,
  ModalWrap, ModalOverlay, ModalBox, ModalTitle, ModalText,
  ModalInput, ModalActions, ModalCancelBtn, ModalConfirmBtn,
} from './styles'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',          label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',           label: 'Área do Jogador',    icon: Home },
]

const ROLES = ['Todos', 'PLAYER', 'OWNER', 'ADMIN']

const ROLE_COLORS = {
  ADMIN:  '#d97706',
  OWNER:  '#16a34a',
  PLAYER: '#2563eb',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers]         = useState<AdminUser[]>([])
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null)
  const [showInvite, setShowInvite]       = useState(false)
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteResult, setInviteResult]   = useState<InviteResult | null>(null) // { email, inviteUrl }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = roleFilter === 'Todos' ? undefined : (roleFilter as UserRole)
      const res = await adminService.listUsers(role)
      setUsers(res.data.data)
    } catch {
      setError('Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSendInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteSending(true)
    try {
      const res = await adminService.inviteOwner(inviteEmail)
      // O `?? res.data?.inviteUrl` era código morto: inviteOwner devolve a
      // resposta axios, então a URL vive sempre em data.data.
      const url = res.data.data.inviteUrl
      setInviteResult({ email: inviteEmail, inviteUrl: url, expiresAt: res.data.data.expiresAt })
      setInviteEmail('')
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao enviar convite.'))
    } finally {
      setInviteSending(false)
    }
  }

  const handleRoleChange = async () => {
    if (!confirmTarget) return
    const next = confirmTarget.role === 'PLAYER' ? 'OWNER' : 'PLAYER'
    setUpdatingId(confirmTarget.id)
    setConfirmTarget(null)
    try {
      await adminService.updateUserRole(confirmTarget.id, next)
      await fetchUsers()
    } catch {
      toast.error('Erro ao alterar role.')
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = {
    total: users.length,
    owners: users.filter((u: AdminUser) => u.role === 'OWNER').length,
    admins: users.filter((u: AdminUser) => u.role === 'ADMIN').length,
    regular: users.filter((u: AdminUser) => u.role === 'PLAYER').length,
  }

  const filtered = users.filter((u: AdminUser) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout
      user={user}
      navItems={NAV_ITEMS}
      tagline="Admin Panel"
      accent="#16a34a"
      pageTitle="Gestão de Usuários"
      pageSub="Gerencie roles, filtre e monitore todos os usuários da plataforma"
    >
      <StatsRow>
        <StatCard label="Total de Usuários" value={counts.total}   accent="#3b82f6" />
        <StatCard label="Owners"            value={counts.owners}  accent="#22c55e" />
        <StatCard label="Admins"            value={counts.admins}  accent="#f59e0b" />
        <StatCard label="Usuários Comuns"   value={counts.regular} accent="#6b7280" />
      </StatsRow>

      <FilterBar>
        <SearchInput
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <RoleFilters>
          {ROLES.map((r) => (
            <RoleBtn key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>
              {r}
            </RoleBtn>
          ))}
        </RoleFilters>
        <button
          onClick={() => setShowInvite(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Mail size={14} />
          Convidar Owner
        </button>
      </FilterBar>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && filtered.length === 0 && !error && (
        <EmptyState>Nenhum usuário encontrado.</EmptyState>
      )}

      {!error && filtered.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>Role</Th>
              <Th center>Peladas</Th>
              <Th center>Locais</Th>
              <Th>Cadastro</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: AdminUser) => (
              <Tr key={u.id}>
                <Td>
                  <AvatarCell color={ROLE_COLORS[u.role] ?? '#6b7280'}>
                    {getInitials(u.name)}
                  </AvatarCell>
                  <UserMeta>
                    <strong>{u.name}</strong>
                    <UserEmail>{u.email}</UserEmail>
                  </UserMeta>
                </Td>
                <Td><RoleBadge role={u.role} /></Td>
                <Td center>{u._count?.peladasCreated ?? 0}</Td>
                <Td center>{u._count?.placesOwned ?? 0}</Td>
                <Td>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</Td>
                <Td>
                  {u.role !== 'ADMIN' && (
                    <ActionBtn
                      onClick={() => setConfirmTarget(u)}
                      disabled={updatingId === u.id}
                    >
                      {updatingId === u.id
                        ? 'Salvando...'
                        : u.role === 'OWNER' ? 'Rebaixar → Jogador' : 'Promover → OWNER'}
                    </ActionBtn>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {showInvite && (
        <ModalWrap>
          <ModalOverlay onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteResult(null) }} />
          <ModalBox>
            {inviteResult ? (
              <>
                <ModalTitle>Convite criado!</ModalTitle>
                <ModalText>
                  O email foi enviado para <strong>{inviteResult.email}</strong>. Se não chegar, compartilhe o link abaixo diretamente:
                </ModalText>
                <ModalInput
                  readOnly
                  value={inviteResult.inviteUrl ?? ''}
                  onFocus={(e) => e.target.select()}
                />
                <ModalActions>
                  <ModalConfirmBtn
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.inviteUrl ?? '')
                      toast.success('Link copiado!')
                    }}
                  >
                    Copiar link
                  </ModalConfirmBtn>
                  <ModalCancelBtn type="button" onClick={() => { setShowInvite(false); setInviteResult(null) }}>
                    Fechar
                  </ModalCancelBtn>
                </ModalActions>
              </>
            ) : (
              <>
                <ModalTitle>Convidar novo Owner</ModalTitle>
                <ModalText>
                  Informe o e-mail do proprietário do estabelecimento. Um link de convite único e válido por 7 dias será enviado automaticamente.
                </ModalText>
                <form onSubmit={handleSendInvite}>
                  <ModalInput
                    type="email"
                    placeholder="email@estabelecimento.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <ModalActions>
                    <ModalCancelBtn type="button" onClick={() => { setShowInvite(false); setInviteEmail('') }}>
                      Cancelar
                    </ModalCancelBtn>
                    <ModalConfirmBtn type="submit" disabled={inviteSending}>
                      {inviteSending ? 'Criando…' : 'Enviar convite'}
                    </ModalConfirmBtn>
                  </ModalActions>
                </form>
              </>
            )}
          </ModalBox>
        </ModalWrap>
      )}

      {confirmTarget && (() => {
        const next = confirmTarget.role === 'PLAYER' ? 'OWNER' : 'PLAYER'
        const isPromo = next === 'OWNER'
        return (
          <ModalWrap>
            <ModalOverlay onClick={() => setConfirmTarget(null)} />
            <ModalBox>
              <ModalTitle>{isPromo ? 'Promover para Owner' : 'Rebaixar para Usuário'}</ModalTitle>
              <ModalText>
                Você está prestes a {isPromo ? 'promover' : 'rebaixar'} <strong>{confirmTarget.name}</strong> ({confirmTarget.email}) de <strong>{confirmTarget.role}</strong> para <strong>{next}</strong>. Deseja continuar?
              </ModalText>
              <ModalActions>
                <ModalCancelBtn onClick={() => setConfirmTarget(null)}>Cancelar</ModalCancelBtn>
                <ModalConfirmBtn $danger={!isPromo} onClick={handleRoleChange}>
                  {isPromo ? 'Promover' : 'Rebaixar'}
                </ModalConfirmBtn>
              </ModalActions>
            </ModalBox>
          </ModalWrap>
        )
      })()}
    </DashboardLayout>
  )
}
