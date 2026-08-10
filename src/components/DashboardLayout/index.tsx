import { Sun, Moon, LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import LogoSvg from '../LogoSvg'
import NotificationBell from '../NotificationBell'
import ContentLoader from '../ContentLoader'
import { PageHeaderProvider } from './pageHeader'
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
  navItems: NavItemDef[]
  tagline: string
  accent: string
}

/**
 * Layout compartilhado para os painéis de Admin e Owner.
 *
 * É **rota-pai**: renderiza `<Outlet />` em vez de receber `children`. Assim a
 * sidebar, a topbar e a conexão SSE do sino sobrevivem à troca de rota, em vez
 * de serem destruídas e recriadas por cada página (#197).
 *
 * Título, subtítulo e ações da topbar deixaram de ser props e passaram a ser
 * publicados pela página via `usePageHeader` e `<PageActions>`.
 */
export default function DashboardLayout({
  navItems,
  tagline,
  accent,
}: DashboardLayoutProps) {
  const { isDark, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [header, setHeaderState] = useState<{ title: string; sub?: string }>({ title: '' })
  const [navBadges, setNavBadges] = useState<Record<string, number>>({})
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null)

  // Identidade estável: é dependência do efeito em `usePageHeader`. A
  // comparação evita re-render quando a página republica o mesmo título.
  const setHeader = useCallback((title: string, sub?: string) => {
    setHeaderState((anterior) =>
      anterior.title === title && anterior.sub === sub ? anterior : { title, sub },
    )
  }, [])

  const setNavBadge = useCallback((to: string, count: number) => {
    setNavBadges((anterior) => (anterior[to] === count ? anterior : { ...anterior, [to]: count }))
  }, [])

  const headerContext = useMemo(
    () => ({ setHeader, setNavBadge, actionsSlot }),
    [setHeader, setNavBadge, actionsSlot],
  )

  const itensComBadge = useMemo(
    () => navItems.map((item) => (navBadges[item.to] != null ? { ...item, badge: navBadges[item.to] } : item)),
    [navItems, navBadges],
  )

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
          {itensComBadge.map(({ to, label, icon: Icon, badge, divider, end }) => (
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
              <TopbarTitle>{header.title}</TopbarTitle>
              {header.sub && <TopbarSub>{header.sub}</TopbarSub>}
            </div>
            <TopbarActions>
              <NotificationBell />
              {/* Alvo do portal de `<PageActions>`. `display: contents` faz os
                  filhos virarem itens do flex de TopbarActions, preservando o
                  espaçamento que existia quando as ações vinham por prop. */}
              <span ref={setActionsSlot} style={{ display: 'contents' }} />
            </TopbarActions>
          </TopbarRow>
        </Topbar>

        <Content>
          <PageHeaderProvider value={headerContext}>
            <Suspense fallback={<ContentLoader />}>
              <Outlet />
            </Suspense>
          </PageHeaderProvider>
        </Content>
      </Main>
    </Shell>
  )
}
