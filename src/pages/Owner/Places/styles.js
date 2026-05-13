import styled from 'styled-components'

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`

export const PlaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
`

export const PlaceCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const PlaceCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

export const PlaceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

export const PlaceName = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const PlaceMeta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
  white-space: nowrap;
  flex-shrink: 0;
`

export const PlaceDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

export const PlaceActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`

const VARIANT_STYLES = {
  secondary: { bg: '#f3f4f6', border: '#e5e7eb', color: '#374151', hoverBg: '#e5e7eb' },
  success:   { bg: '#dcfce7', border: '#22c55e', color: '#15803d', hoverBg: '#22c55e' },
  danger:    { bg: '#fee2e2', border: '#ef4444', color: '#b91c1c', hoverBg: '#ef4444' },
}

export const ActionBtn = styled.button`
  flex: 1;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  border: 1px solid ${({ variant = 'secondary' }) => VARIANT_STYLES[variant].border};
  background: ${({ variant = 'secondary' }) => VARIANT_STYLES[variant].bg};
  color: ${({ variant = 'secondary' }) => VARIANT_STYLES[variant].color};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${({ variant = 'secondary' }) => VARIANT_STYLES[variant].hoverBg};
    color: ${({ variant }) => variant === 'secondary' ? '#111827' : '#fff'};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 48px 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.7;
`

export const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 16px;
`
