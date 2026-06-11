import { useState, useEffect, useCallback } from 'react'
import { Users, ClipboardList, Building2, LayoutDashboard, Home, Store } from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import StatCard from '../../../components/StatCard'
import RoleBadge from '../../../components/RoleBadge'
import { useAuth } from '../../../contexts/AuthContext'
import * as adminService from '../../../services/admin'
import {
  StatsRow, FilterBar, SearchInput, RoleFilters, RoleBtn,
  Table, Th, Tr, Td, AvatarCell, UserMeta, UserEmail,
  ActionBtn, EmptyState, ErrorMsg,
} from './styles'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Visão Geral',        icon: LayoutDashboard },
  { to: '/admin/users',    label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',          label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',           label: 'Área do Jogador',    icon: Home },
]

const ROLES = ['Todos', 'USER', 'OWNER', 'ADMIN']

const ROLE_COLORS = {
  ADMIN: '#d97706',
  OWNER: '#16a34a',
  USER:  '#2563eb',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers]         = useState([])
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = roleFilter === 'Todos' ? undefined : roleFilter
      const res = await adminService.listUsers(role)
      setUsers(res.data.data)
    } catch {
      setError('Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (targetUser) => {
    const next = targetUser.role === 'USER' ? 'OWNER' : 'USER'
    const ok = window.confirm(`Alterar role de "${targetUser.name}" para ${next}?`)
    if (!ok) return
    setUpdatingId(targetUser.id)
    try {
      await adminService.updateUserRole(targetUser.id, next)
      await fetchUsers()
    } catch {
      alert('Erro ao alterar role.')
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = {
    total: users.length,
    owners: users.filter((u) => u.role === 'OWNER').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    regular: users.filter((u) => u.role === 'USER').length,
  }

  const filtered = users.filter((u) =>
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
            {filtered.map((u) => (
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
                      onClick={() => handleRoleChange(u)}
                      disabled={updatingId === u.id}
                    >
                      {updatingId === u.id
                        ? 'Salvando...'
                        : u.role === 'OWNER' ? 'Rebaixar → USER' : 'Promover → OWNER'}
                    </ActionBtn>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardLayout>
  )
}
