import styled from 'styled-components'

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`
export const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  h1 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: bold;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
  }
`
export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`
export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  h2 {
    font-size: 18px;
    margin-bottom: 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
    padding-bottom: 12px;
  }
`
export const PlanHighlight = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  h3 {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 20px;
  }
  .price {
    font-size: 28px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`
export const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
  .label {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
  }
  .value {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: bold;
    font-size: 14px;
  }
`
export const PrimaryButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;
`
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

export const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const StatIcon = styled.div<{ $color?: string; }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ $color }) => $color}18;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const StatInfo = styled.div`
  min-width: 0;
`

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`

export const StatLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

export const Badge = styled.span<{ $status?: string; }>`
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: bold;
  background: ${({ $status, theme }) =>
    $status === 'active' || $status === 'trialing'
      ? theme.colors.successLight
      : theme.colors.warningLight};
  color: ${({ $status, theme }) =>
    $status === 'active' || $status === 'trialing'
      ? theme.colors.success
      : theme.colors.warning};
`

/**
 * No lugar dos números, quando o plano não abre estatísticas.
 *
 * Convite, e não bloqueio: a página inteira continua sendo do dono — só esta faixa
 * é de outro degrau. Quatro cartões com traço no lugar do número pareceriam painel
 * quebrado, que é a leitura errada e a que mais gera suporte.
 */
export const ConviteEstatisticas = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  margin-bottom: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};

  > svg { color: ${({ theme }) => theme.colors.primary}; flex-shrink: 0; }

  div { flex: 1; min-width: 220px; }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  p {
    margin: 4px 0 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.5;
  }
`
