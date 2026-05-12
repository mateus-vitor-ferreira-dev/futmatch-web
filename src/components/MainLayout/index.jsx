import { Home, Search, ClipboardList, History, User } from 'lucide-react'
import {
  AppShell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Nav, NavItem, UserCard, Avatar, UserInfo, UserName, UserBadge, Content,
} from './styles'

const NAV_ITEMS = [
  { to: '/home',         label: 'Início',         icon: Home          },
  { to: '/quero-jogar',  label: 'Quero Jogar',    icon: Search        },
  { to: '/minhas-peladas', label: 'Minhas Peladas', icon: ClipboardList },
  { to: '/historico',    label: 'Histórico',      icon: History       },
  { to: '/perfil',       label: 'Perfil',         icon: User          },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export default function MainLayout({ children, user }) {
  const initials = getInitials(user?.name)

  return (
    <AppShell>
      <Sidebar>
        {/* Logo */}
        <Logo>
          <LogoIcon>⚽</LogoIcon>
          <LogoText>
            <LogoName>FutMatch</LogoName>
            <LogoTagline>Encontre sua pelada</LogoTagline>
          </LogoText>
        </Logo>

        {/* Navigation */}
        <Nav>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to}>
              <Icon />
              {label}
            </NavItem>
          ))}
        </Nav>

        {/* User card */}
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
