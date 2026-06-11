import styled from 'styled-components'

export const Wrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  padding: 16px 0 24px;
`

export const BracketGrid = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0;
  min-width: fit-content;
`

export const Round = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 210px;
`

export const RoundLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
  text-align: center;
`

export const MatchesColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap || '16px'};
  width: 100%;
  padding: 0 8px;
`

export const MatchCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const TeamRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${({ $winner, theme }) =>
    $winner ? theme.colors.primarySubtle : 'transparent'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }
`

export const TeamName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $winner, theme }) =>
    $winner ? theme.fontWeights.semibold : theme.fontWeights.regular};
  color: ${({ $winner, $empty, theme }) =>
    $empty
      ? theme.colors.textMuted
      : $winner
      ? theme.colors.primaryDark
      : theme.colors.textPrimary};
  font-style: ${({ $empty }) => $empty ? 'italic' : 'normal'};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Connector = styled.div`
  width: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 18px;
  align-self: stretch;
`

export const DivisionTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 8px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const EmptyBracket = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  span {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 12px;
  }
`

export const LoadingBracket = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const LevelBadge = styled.span`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warning};
  white-space: nowrap;
`