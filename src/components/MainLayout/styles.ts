import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

export const AppShell = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgApp};
  font-family: ${({ theme }) => theme.fonts.sans};
`

// ── Overlay (mobile only) ─────────────────────────────────────────────────────

export const Overlay = styled.div<{ $open?: boolean; }>`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $open }) => ($open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
  }
`

// ── Sidebar ──────────────────────────────────────────────────────────────────

export const Sidebar = styled.aside<{ $open?: boolean; }>`
  width: ${({ theme }) => theme.sidebar.width};
  min-width: ${({ theme }) => theme.sidebar.width};
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgSidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  position: sticky;
  top: 0;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 0.25s ease;
    box-shadow: ${({ $open }) => ($open ? '4px 0 24px rgba(0,0,0,0.15)' : 'none')};
  }
`

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 32px;
`

export const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

export const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`

export const LogoName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`

export const LogoTagline = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`

export const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
`

// ── User card (bottom of sidebar) ────────────────────────────────────────────

export const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-top: 12px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
  }
`

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
`

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

export const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const UserBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

// ── Content wrapper ───────────────────────────────────────────────────────────

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`

// ── Mobile Topbar ─────────────────────────────────────────────────────────────

export const MobileTopbar = styled.header`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: ${({ theme }) => theme.colors.bgSidebar};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    position: sticky;
    top: 0;
    z-index: 100;
    flex-shrink: 0;
  }
`

export const HamburgerBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: ${({ theme }) => theme.colors.primarySubtle};
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`

export const TopbarLogoName = styled.span`
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const ThemeToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};
  margin-bottom: 4px;

  &:hover { opacity: 0.85; }

  svg { flex-shrink: 0; width: 18px; height: 18px; }
`

export const ThemeToggleBtnCompact = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: opacity 0.15s;
  flex-shrink: 0;

  &:hover { opacity: 0.85; }
`

export const NavDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 8px 4px;
`

export const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 4px;
  padding: 10px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  svg { flex-shrink: 0; }
`

// ── Main content ─────────────────────────────────────────────────────────────

export const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  min-width: 0;

  @media (max-width: 768px) {
    padding: 16px;
  }
`
