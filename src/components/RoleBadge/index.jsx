import { Badge } from './styles'

const ROLE_MAP = {
  ADMIN: { label: 'Admin',  bg: '#fef3c7', color: '#d97706' },
  OWNER: { label: 'Owner',  bg: '#dcfce7', color: '#16a34a' },
  USER:  { label: 'Usuário', bg: '#dbeafe', color: '#2563eb' },
}

/**
 * @param {{ role: 'ADMIN' | 'OWNER' | 'USER' }} props
 */
export default function RoleBadge({ role }) {
  const { label, bg, color } = ROLE_MAP[role] ?? ROLE_MAP.USER
  return <Badge style={{ background: bg, color }}>{label}</Badge>
}
