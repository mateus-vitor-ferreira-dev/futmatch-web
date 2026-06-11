import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
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
export const Badge = styled.span`
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: bold;
  background: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.successLight
      : theme.colors.warningLight};
  color: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.success
      : theme.colors.warning};
`
