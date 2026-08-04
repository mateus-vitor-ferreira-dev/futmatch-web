import { Badge } from './styles'
import type { UserRole } from '../../types/api'

interface RoleStyle {
  label: string
  bg: string
  color: string
}

/**
 * A chave USER não corresponde a nenhum papel da API — os papéis são PLAYER,
 * OWNER e ADMIN. Ela é o rótulo genérico de fallback, e é o que o PLAYER acaba
 * exibindo ("Usuário"). Mantido como estava, apenas explicitado no tipo:
 * Partial deixa claro que nem todo UserRole tem entrada própria.
 */
const ROLE_MAP: Partial<Record<UserRole | 'USER', RoleStyle>> = {
  ADMIN: { label: 'Admin',   bg: '#fef3c7', color: '#d97706' },
  OWNER: { label: 'Owner',   bg: '#dcfce7', color: '#16a34a' },
  USER:  { label: 'Usuário', bg: '#dbeafe', color: '#2563eb' },
}

const FALLBACK: RoleStyle = { label: 'Usuário', bg: '#dbeafe', color: '#2563eb' }

export interface RoleBadgeProps {
  role: UserRole
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const { label, bg, color } = ROLE_MAP[role] ?? FALLBACK
  return <Badge style={{ background: bg, color }}>{label}</Badge>
}
