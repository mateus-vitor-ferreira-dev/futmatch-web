import { Sun, Moon, LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UserMe } from '../../types/api'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import LogoSvg from '../LogoSvg'
import NotificationBell from '../NotificationBell'
import {
  Shell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Divider, Nav, NavItem, NavBadge,
  UserCard, Avatar, UserInfo, UserName, UserRole,
  ThemeToggleBtn, LogoutBtn,
  Main, Topbar, TopbarRow, TopbarTitle, TopbarSub, TopbarActions, Content,
  MobileMenuBtn, MobileOverlay,
} from './styles'

function getInitials(name = ''): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

/** Item da barra lateral dos painéis. */
export interface NavItemDef {
  to: string
  label: string
  icon: LucideIcon
  /** Contador exibido à direita; só aparece se > 0. */
  badge?: number
  /** Insere um separador acima deste item. */
  divider?: boolean
  /** Repassado ao NavLink: exige correspondência exata da rota. */
  end?: boolean
}

export interface DashboardLayoutProps {
  user?: UserMe | null
  navItems: NavItemDef[]
  tagline: string
  accent: string
  pageTitle: string
  pageSub?: string
  topbarActions?: ReactNode
  children: ReactNode
}

/** Layout compartilhado para os painéis de Admin e Owner. */
export default function DashboardLayout({
  user,
  navItems,
  tagline,
  accent,
  pageTitle,
  pageSub,
  topbarActions,
  children,
}: DashboardLayoutProps) {
  const { isDark, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Shell>
      {mobileMenuOpen && <MobileOverlay onClick={() => setMobileMenuOpen(false)} />}
      <Sidebar $open={mobileMenuOpen}>
        <Logo>
          <LogoIcon>
            <LogoSvg height={30} />
          </LogoIcon>
          <LogoText>
            <LogoName>Só+1</LogoName>
            <LogoTagline accent={accent}>{tagline}</LogoTagline>
          </LogoText>
        </Logo>

        <Divider />

        <Nav>
          {navItems.map(({ to, label, icon: Icon, badge, divider, end }) => (
            <span key={to}>
              {divider && <Divider />}
              <NavItem to={to} end={!!end} onClick={() => setMobileMenuOpen(false)}>
                <Icon size={18} />
                {label}
                {badge != null && badge > 0 && <NavBadge>{badge}</NavBadge>}
              </NavItem>
            </span>
          ))}

        </Nav>

        <ThemeToggleBtn type="button" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </ThemeToggleBtn>

        <LogoutBtn onClick={handleLogout}>
          <LogOut size={16} />
          Sair da conta
        </LogoutBtn>

        {user && (
          <UserCard onClick={() => navigate('/perfil')} title="Editar perfil">
            <Avatar>{getInitials(user.name)}</Avatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              <UserRole accent={accent}>{user.role}</UserRole>
            </UserInfo>
          </UserCard>
        )}
      </Sidebar>

      <Main>
        <Topbar>
          <TopbarRow>
            <MobileMenuBtn
              type="button"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((aberto) => !aberto)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </MobileMenuBtn>
            <div className="page-heading">
              <TopbarTitle>{pageTitle}</TopbarTitle>
              {pageSub && <TopbarSub>{pageSub}</TopbarSub>}
            </div>
            <TopbarActions>
              <NotificationBell />
              {topbarActions}
            </TopbarActions>
          </TopbarRow>
        </Topbar>

        <Content>{children}</Content>
      </Main>
    </Shell>
  )
}
