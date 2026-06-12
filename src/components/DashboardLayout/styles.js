import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

export const Shell = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgApp};
  font-family: ${({ theme }) => theme.fonts.sans};
`

// ── Sidebar ───────────────────────────────────────────────────────────────────

export const Sidebar = styled.aside`
  width: 240px;
  min-width: 240px;
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
  margin-bottom: 8px;
`

export const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

export const LogoText = styled.div`
  display: flex;
  flex-direction: column;
`

export const LogoName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`

export const LogoTagline = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ accent }) => accent};
`

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 16px 8px;
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
  position: relative;

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

export const NavBadge = styled.span`
  margin-left: auto;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
`

// ── Theme toggle ──────────────────────────────────────────────────────────────

export const ThemeToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};
  margin-bottom: 4px;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg { flex-shrink: 0; }
`

// ── User card ─────────────────────────────────────────────────────────────────

export const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-top: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
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
  color: #fff;
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

export const UserRole = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ accent }) => accent};
`

// ── Main area ─────────────────────────────────────────────────────────────────

export const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`

export const Topbar = styled.header`
  background: ${({ theme }) => theme.colors.bgSidebar};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 16px 32px;
`

export const TopbarTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px;
`

export const TopbarSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

export const TopbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const TopbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
`
