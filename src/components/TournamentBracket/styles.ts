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

export const MatchesColumn = styled.div<{ $gap?: string; }>`
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

export const TeamRow = styled.div<{ $winner?: boolean; }>`
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

export const TeamName = styled.span<{ $empty?: boolean; $winner?: boolean; }>`
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

/**
 * O placar de um lado, ao lado do nome.
 *
 * Fica vazio — e não zerado — enquanto a partida não terminou: `0` é um placar,
 * e uma partida que ainda não começou não tem nenhum.
 */
export const Score = styled.span<{ $winner?: boolean; }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $winner, theme }) =>
    $winner ? theme.fontWeights.bold : theme.fontWeights.semibold};
  color: ${({ $winner, theme }) =>
    $winner ? theme.colors.primaryDark : theme.colors.textSecondary};
  min-width: 16px;
  text-align: right;
`

/**
 * Etiqueta de estado, só nos dois casos em que o resto do cartão não conta a
 * história: o jogo rolando agora e o W.O.
 *
 * Em `FINISHED` quem fala é o placar, em `SCHEDULED` é a data, e `PENDING` não
 * tem o que dizer — etiquetar os três encheria a chave de rótulo redundante.
 */
export const StatusTag = styled.span<{ $tone: 'live' | 'wo'; }>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $tone, theme }) =>
    $tone === 'live' ? theme.colors.successLight : theme.colors.warningLight};
  color: ${({ $tone, theme }) =>
    $tone === 'live' ? theme.colors.success : theme.colors.warningText};
  white-space: nowrap;
`

/** Quadra, horário e árbitro — o que existir. Some inteiro quando não há nada. */
export const MatchMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`
