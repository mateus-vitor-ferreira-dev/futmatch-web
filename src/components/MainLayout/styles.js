import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

export const AppShell = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgApp};
  font-family: ${({ theme }) => theme.fonts.sans};
`

// ── Sidebar ──────────────────────────────────────────────────────────────────

export const Sidebar = styled.aside`
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
`

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 32px;
`

export const LogoIcon = styled.div`
  font-size: 28px;
  line-height: 1;
`

export const LogoText = styled.div`
  display: flex;
  flex-direction: column;
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

// ── Main content ─────────────────────────────────────────────────────────────

export const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  min-width: 0;
`
