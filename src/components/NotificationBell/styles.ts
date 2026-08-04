import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
`

export const BellBtn = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid ${({ theme }) => theme.colors.bgSidebar};
`

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 300;
  overflow: hidden;
`

export const DropHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const DropTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const MarkAllBtn = styled.button`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.primary};
  background: none;
  border: none;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.sans};
  padding: 0;

  &:hover { text-decoration: underline; }
`

export const NotifList = styled.div`
  max-height: 360px;
  overflow-y: auto;
`

export const NotifItem = styled.div<{ $read?: boolean; }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  background: ${({ $read, theme }) => $read ? 'transparent' : theme.colors.primarySubtle};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
  }

  &:last-child { border-bottom: none; }
`

export const NotifDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  margin-top: 4px;
`

export const NotifText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px;
  line-height: 1.4;
`

export const NotifTime = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const EmptyMsg = styled.p`
  text-align: center;
  padding: 24px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`
