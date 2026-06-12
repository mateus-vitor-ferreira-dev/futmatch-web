import { Sun, Moon, LayoutDashboard, Store } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import iconUrl from '../../assets/icon-so-mais-um.svg'
import logoUrl from '../../assets/logo-so-mais-um.svg'
import {
  Shell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Divider, Nav, NavItem, NavBadge,
  UserCard, Avatar, UserInfo, UserName, UserRole,
  ThemeToggleBtn,
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
  const crossPanel = getCrossPanel(user?.role, pathname)

  return (
    <Shell>
      <Sidebar>
        <Logo>
          <LogoIcon>
            <img src={iconUrl} alt="" height="30" style={{ display: 'block' }} />
          </LogoIcon>
          <LogoText>
            <img
              src={logoUrl}
              alt="Só+1"
              height="24"
              style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            />
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
            {topbarActions && <TopbarActions>{topbarActions}</TopbarActions>}
          </TopbarRow>
        </Topbar>

        <Content>{children}</Content>
      </Main>
    </Shell>
  )
}
