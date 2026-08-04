import { Sun, Moon, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Shell>
      <Sidebar>
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
              <NavItem to={to} end={!!end}>
                <Icon size={18} />
                {label}
                {badge > 0 && <NavBadge>{badge}</NavBadge>}
              </NavItem>
            </span>
          ))}

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
