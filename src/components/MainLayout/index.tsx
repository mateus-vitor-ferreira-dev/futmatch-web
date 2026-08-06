import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { UserMe, UserRole } from '../../types/api'
import { Home, Search, ClipboardList, History, User, Plus, Trophy, Menu, Star, Sun, Moon, LayoutDashboard, Store, LogOut } from 'lucide-react'
import iconUrl from '../../assets/icon-so-mais-um.svg'
import LogoSvg from '../LogoSvg'
import { useNavigate, useLocation } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBell from '../NotificationBell'
import {
  AppShell, Overlay, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Nav, NavItem, NavDivider, UserCard, Avatar, UserInfo, UserName, UserBadge,
  ContentWrapper, MobileTopbar, HamburgerBtn, TopbarLogoName, Content,
  ThemeToggleBtn, ThemeToggleBtnCompact, LogoutBtn,
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

interface PanelLink {
  to: string
  label: string
  icon: LucideIcon
}

function getPanelLinks(role: UserRole | undefined): PanelLink[] {
  if (role === 'ADMIN') return [
    { to: '/admin', label: 'Painel Admin', icon: LayoutDashboard },
    { to: '/owner', label: 'Painel Owner', icon: Store },
  ]
  if (role === 'OWNER') return [
    { to: '/owner', label: 'Painel Owner', icon: Store },
  ]
  return []
}

function getInitials(name = ''): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export interface MainLayoutProps {
  children: ReactNode
  user?: UserMe | null
}

export default function MainLayout({ children, user }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const initials = getInitials(user?.name)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeFlash, setThemeFlash] = useState(false)
  const themeFlashTimer = useRef<number | null>(null)
  const { isDark, toggleTheme } = useThemeMode()
  const { logout } = useAuth()

  function handleToggleTheme() {
    if (themeFlashTimer.current) {
      window.clearTimeout(themeFlashTimer.current)
    }

    setThemeFlash(true)
    toggleTheme()

    themeFlashTimer.current = window.setTimeout(() => {
      setThemeFlash(false)
      themeFlashTimer.current = null
    }, 180)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <AppShell>
      <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <Logo>
          <LogoIcon>
            <LogoSvg height={32} />
          </LogoIcon>
          <LogoText>
            <LogoName>Só+1</LogoName>
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

          {getPanelLinks(user?.role).length > 0 && (
            <>
              <NavDivider />
              {getPanelLinks(user?.role).map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to}>
                  <Icon />
                  {label}
                </NavItem>
              ))}
            </>
          )}
        </Nav>

        <ThemeToggleBtn onClick={handleToggleTheme} $flash={themeFlash}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </ThemeToggleBtn>

        <LogoutBtn onClick={handleLogout}>
          <LogOut size={18} />
          Sair da conta
        </LogoutBtn>

        {user && (
          <UserCard onClick={() => navigate('/perfil')}>
            <Avatar>{initials}</Avatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              {/*
                * Era `user.rating` — campo que a API não devolve em nenhum
                * endpoint. O `?? '—'` sempre vencia, então a nota nunca
                * aparecia. O valor real vive em stats.averageStars.
                *
                * ATENÇÃO: o AuthContext popula o usuário via /auth/me, que NÃO
                * inclui `stats` (só /users/:id e /users/me incluem). Então isto
                * continua exibindo '—' até o contexto passar a buscar o perfil
                * completo, ou /auth/me passar a devolver stats.
                */}
              <UserBadge>⭐ {user.stats?.averageStars ?? '—'} · {user.badge ?? 'Jogador'}</UserBadge>
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <ThemeToggleBtnCompact onClick={handleToggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'} $flash={themeFlash}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </ThemeToggleBtnCompact>
          </div>
        </MobileTopbar>

        <Content>{children}</Content>
      </ContentWrapper>
    </AppShell>
  )
}
