import { Sun, Moon, LayoutDashboard, Store, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import logoUrl from '../../assets/logo-so-mais-um.svg'
import NotificationBell from '../NotificationBell'
import {
  Shell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Divider, Nav, NavItem, NavBadge,
  UserCard, Avatar, UserInfo, UserName, UserRole,
  ThemeToggleBtn, LogoutBtn,
  Main, Topbar, TopbarRow, TopbarTitle, TopbarSub, TopbarActions, Content,
} from './styles'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

/**
 * Layout compartilhado para os painéis de Admin e Owner.
 *
 * @param {{
 *   user: object,
 *   navItems: Array<{ to: string, label: string, icon: React.ElementType, badge?: number }>,
 *   tagline: string,
 *   accent: string,
 *   pageTitle: string,
 *   pageSub?: string,
 *   topbarActions?: React.ReactNode,
 *   children: React.ReactNode,
 * }} props
 */
function getCrossPanel(role, pathname) {
  if (role === 'ADMIN' && pathname.startsWith('/owner'))
    return { to: '/admin', label: 'Painel Admin', Icon: LayoutDashboard }
  if (role === 'ADMIN' && pathname.startsWith('/admin'))
    return { to: '/owner', label: 'Painel Owner', Icon: Store }
  return null
}

export default function DashboardLayout({
  user,
  navItems,
  tagline,
  accent,
  pageTitle,
  pageSub,
  topbarActions,
  children,
}) {
  const { isDark, toggleTheme } = useThemeMode()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const crossPanel = getCrossPanel(user?.role, pathname)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Shell>
      <Sidebar>
        <Logo>
          <LogoIcon>
            <img
              src={logoUrl}
              alt="Só+1"
              height="30"
              style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            />
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
              <NavItem to={to} end={!!end}>
                <Icon size={18} />
                {label}
                {badge > 0 && <NavBadge>{badge}</NavBadge>}
              </NavItem>
            </span>
          ))}

          {crossPanel && (
            <>
              <Divider />
              <NavItem to={crossPanel.to}>
                <crossPanel.Icon size={18} />
                {crossPanel.label}
              </NavItem>
            </>
          )}
        </Nav>

        <ThemeToggleBtn onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </ThemeToggleBtn>

        <LogoutBtn onClick={handleLogout}>
          <LogOut size={16} />
          Sair da conta
        </LogoutBtn>

        {user && (
          <UserCard>
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
            <div>
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
