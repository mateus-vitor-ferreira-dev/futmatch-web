import { Home, Search, ClipboardList, History, User } from 'lucide-react'
import {
  AppShell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Nav, NavItem, UserCard, Avatar, UserInfo, UserName, UserBadge, Content,
} from './styles'

/** Itens de navegação da sidebar */
const NAV_ITEMS = [
  { to: '/home',           label: 'Início',          icon: Home          },
  { to: '/quero-jogar',    label: 'Quero Jogar',     icon: Search        },
  { to: '/minhas-peladas', label: 'Minhas Peladas',  icon: ClipboardList },
  { to: '/historico',      label: 'Histórico',       icon: History       },
  { to: '/perfil',         label: 'Perfil',          icon: User          },
]

/**
 * Gera as iniciais do nome para exibir no avatar.
 * Ex: "João Silva" → "JS"
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

/**
 * Layout principal pós-autenticação.
 *
 * Estrutura: sidebar fixa à esquerda + área de conteúdo à direita.
 * A sidebar exibe logo, navegação e card do usuário logado.
 *
 * @param {{
 *   children: React.ReactNode,
 *   user: { name: string, rating?: number, badge?: string } | null,
 * }} props
 */
export default function MainLayout({ children, user }) {
  const initials = getInitials(user?.name)

  return (
    <AppShell>
      <Sidebar>
        <Logo>
          <LogoIcon>⚽</LogoIcon>
          <LogoText>
            <LogoName>FutMatch</LogoName>
            <LogoTagline>Encontre sua pelada</LogoTagline>
          </LogoText>
        </Logo>

        <Nav>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to}>
              <Icon />
              {label}
            </NavItem>
          ))}
        </Nav>

        {user && (
          <UserCard>
            <Avatar>{initials}</Avatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              <UserBadge>⭐ {user.rating ?? '—'} · {user.badge ?? 'Jogador'}</UserBadge>
            </UserInfo>
          </UserCard>
        )}
      </Sidebar>

      <Content>{children}</Content>
    </AppShell>
  )
}
