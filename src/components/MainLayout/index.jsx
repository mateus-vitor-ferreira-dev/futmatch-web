import { useState, useEffect } from 'react'
import { Home, Search, ClipboardList, History, User, Plus, Trophy, Menu } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell, Overlay, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Nav, NavItem, UserCard, Avatar, UserInfo, UserName, UserBadge,
  ContentWrapper, MobileTopbar, HamburgerBtn, TopbarLogoName, Content,
} from './styles'

const NAV_ITEMS = [
  { to: '/home',           label: 'Início',          icon: Home          },
  { to: '/quero-jogar',    label: 'Quero Jogar',     icon: Search        },
  { to: '/criar-pelada',   label: 'Criar Pelada',    icon: Plus          },
  { to: '/torneios',       label: 'Torneios',        icon: Trophy        },
  { to: '/minhas-peladas', label: 'Minhas Peladas',  icon: ClipboardList },
  { to: '/historico',      label: 'Histórico',       icon: History       },
  { to: '/perfil',         label: 'Perfil',          icon: User          },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export default function MainLayout({ children, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const initials = getInitials(user?.name)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fecha a sidebar ao navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <AppShell>
      <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
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
          <UserCard onClick={() => navigate('/perfil')}>
            <Avatar>{initials}</Avatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              <UserBadge>⭐ {user.rating ?? '—'} · {user.badge ?? 'Jogador'}</UserBadge>
            </UserInfo>
          </UserCard>
        )}
      </Sidebar>

      <ContentWrapper>
        <MobileTopbar>
          <HamburgerBtn onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </HamburgerBtn>
          <TopbarLogoName>FutMatch</TopbarLogoName>
        </MobileTopbar>

        <Content>{children}</Content>
      </ContentWrapper>
    </AppShell>
  )
}
