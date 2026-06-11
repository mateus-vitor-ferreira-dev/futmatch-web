import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1400px;
  margin: 0 auto;
`

export const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  h1 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: bold;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-top: 4px;
  }
`

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`

export const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 8px;
  }
  p {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: bold;
  }
`

export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  th,
  td {
    padding: ${({ theme }) => theme.spacing[4]};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
  th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: bold;
    text-transform: uppercase;
  }
  td {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    vertical-align: middle;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
`

export const Badge = styled.span`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: bold;
  background: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.successLight
      : $status === 'Pendente'
        ? theme.colors.warningLight
        : theme.colors.errorLight};
  color: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.success
      : $status === 'Pendente'
        ? theme.colors.warning
        : theme.colors.error};
`

export const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`
