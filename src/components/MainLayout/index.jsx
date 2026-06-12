import { useState, useEffect } from 'react'
import { Home, Search, ClipboardList, History, User, Plus, Trophy, Menu, Star, Sun, Moon, LayoutDashboard, Store } from 'lucide-react'
import iconUrl from '../../assets/icon-so-mais-um.svg'
import logoUrl from '../../assets/logo-so-mais-um.svg'
import { useNavigate, useLocation } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import {
  AppShell, Overlay, Sidebar, Logo, LogoIcon, LogoText, LogoTagline,
  Nav, NavItem, NavDivider, UserCard, Avatar, UserInfo, UserName, UserBadge,
  ContentWrapper, MobileTopbar, HamburgerBtn, TopbarLogoName, Content,
  ThemeToggleBtn,
} from './styles'

const NAV_ITEMS = [
  { to: '/home',           label: 'Início',          icon: Home          },
  { to: '/quero-jogar',    label: 'Quero Jogar',     icon: Search        },
  { to: '/criar-pelada',   label: 'Criar Pelada',    icon: Plus          },
  { to: '/torneios',       label: 'Torneios',        icon: Trophy        },
  { to: '/minhas-peladas', label: 'Minhas Peladas',  icon: ClipboardList },
  { to: '/historico',      label: 'Histórico',       icon: History       },
  { to: '/avaliacoes',     label: 'Avaliações',      icon: Star          },
  { to: '/perfil',         label: 'Perfil',          icon: User          },
]

function getPanelLink(role) {
  if (role === 'ADMIN')  return { to: '/admin', label: 'Painel Admin',  icon: LayoutDashboard }
  if (role === 'OWNER')  return { to: '/owner', label: 'Painel Owner',  icon: Store }
  return null
}

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
  const { isDark, toggleTheme } = useThemeMode()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <AppShell>
      <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <Logo>
          <LogoIcon>
            <img src={iconUrl} alt="" height="32" style={{ display: 'block' }} />
          </LogoIcon>
          <LogoText>
            <img
              src={logoUrl}
              alt="Só+1"
              height="26"
              style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            />
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

          {getPanelLink(user?.role) && (() => {
            const { to, label, icon: Icon } = getPanelLink(user.role)
            return (
              <>
                <NavDivider />
                <NavItem to={to}>
                  <Icon />
                  {label}
                </NavItem>
              </>
            )
          })()}
        </Nav>

        <ThemeToggleBtn
          onClick={toggleTheme}
          title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          style={{ margin: '8px 4px 4px' }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </ThemeToggleBtn>

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
          <TopbarLogoName>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#3BAA34', borderRadius: 8, width: 32, height: 32, marginRight: 8, verticalAlign: 'middle', flexShrink: 0 }}>
              <img src={iconUrl} alt="" height="22" style={{ display: 'block' }} />
            </span>
            Só+1
          </TopbarLogoName>
          <ThemeToggleBtn
            onClick={toggleTheme}
            style={{ marginLeft: 'auto' }}
            title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </ThemeToggleBtn>
        </MobileTopbar>

        <Content>{children}</Content>
      </ContentWrapper>
    </AppShell>
  )
}
