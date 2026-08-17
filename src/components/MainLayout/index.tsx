import { Suspense, useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '../../types/api'
import { Home, Search, ClipboardList, History, User, Plus, Trophy, Menu, Star, Sun, Moon, LayoutDashboard, Store, LogOut } from 'lucide-react'
import iconUrl from '../../assets/icon-so-mais-um.svg'
import LogoSvg from '../LogoSvg'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBell from '../NotificationBell'
import ContentLoader from '../ContentLoader'
import { prefetchRota } from '../../routes/paginas'
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

/**
 * Layout da área do jogador.
 *
 * É **rota-pai**: renderiza `<Outlet />` em vez de receber `children`. Antes da
 * #197 cada uma das dez páginas renderizava este layout dentro de si, então
 * trocar de rota desmontava a sidebar e derrubava a conexão SSE do sino.
 *
 * `user` vem do contexto de autenticação, não mais por prop — a rota-pai não
 * tem quem lhe passe a prop, e todas as páginas já liam do mesmo `useAuth`.
 */
export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDark, toggleTheme } = useThemeMode()
  const { logout, user } = useAuth()
  const initials = getInitials(user?.name)

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
            // `onFocus` junto do hover para quem navega por teclado ter o
            // mesmo ganho — só o mouse deixaria esse usuário de fora.
            <NavItem key={to} to={to} onMouseEnter={() => prefetchRota(to)} onFocus={() => prefetchRota(to)}>
              <Icon />
              {label}
            </NavItem>
          ))}

          {getPanelLinks(user?.role).length > 0 && (
            <>
              <NavDivider />
              {getPanelLinks(user?.role).map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} onMouseEnter={() => prefetchRota(to)} onFocus={() => prefetchRota(to)}>
                  <Icon />
                  {label}
                </NavItem>
              ))}
            </>
          )}
        </Nav>

        <ThemeToggleBtn type="button" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
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
                * O `stats` faltava no /auth/me, que é de onde o AuthContext
                * popula o usuário — então aqui e na Home a nota seguia em '—'
                * para quem via 4,8 em Histórico e Avaliações, na mesma sessão.
                * A rota passou a devolvê-lo na api#239, sem custar requisição
                * a mais na abertura do app.
                *
                * O `?.` fica: o campo continua opcional no tipo, e quem nunca
                * foi avaliado recebe `averageStars: null` de propósito — '—' é
                * o que se deve mostrar aí, e não um zero.
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
            <ThemeToggleBtnCompact type="button" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </ThemeToggleBtnCompact>
          </div>
        </MobileTopbar>

        <Content>
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </Content>
      </ContentWrapper>
    </AppShell>
  )
}
