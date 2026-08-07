import styled from 'styled-components'

export const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  @media (max-width: 640px) { align-items: stretch; flex-direction: column; }
`

export const Select = styled.select`
  min-height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const ToolbarActions = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: 480px) { flex-direction: column; }
`

export const PrimaryButton = styled.button`
  min-height: 42px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  padding: 9px 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  &:disabled { opacity: .5; cursor: not-allowed; }
`

export const SecondaryButton = styled(PrimaryButton)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`

export const SummaryCard = styled.div<{ $warning?: boolean }>`
  padding: 16px;
  border: 1px solid ${({ $warning, theme }) => $warning ? '#f59e0b' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const SummaryLabel = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  margin-bottom: 5px;
`

export const SummaryValue = styled.strong`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 24px 0 12px;
`

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

export const SectionHint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

export const Card = styled.article<{ $attention?: boolean }>`
  padding: 17px;
  border: 1px solid ${({ $attention, theme }) => $attention ? '#f59e0b' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`

export const CardTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`

export const Meta = styled.p`
  margin: 5px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.5;
`

export const Badge = styled.span<{ $tone?: 'green' | 'orange' | 'gray' | 'red' }>`
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $tone }) => $tone === 'red' ? '#b91c1c' : $tone === 'orange' ? '#b45309' : $tone === 'gray' ? '#4b5563' : '#15803d'};
  background: ${({ $tone }) => $tone === 'red' ? '#fee2e2' : $tone === 'orange' ? '#fef3c7' : $tone === 'gray' ? '#f3f4f6' : '#dcfce7'};
`

export const Quantity = styled.div`
  margin: 16px 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  strong { color: ${({ theme }) => theme.colors.textPrimary}; font-size: 25px; }
`

export const CardActions = styled.div`
  display: flex;
  gap: 8px;
  button { flex: 1; min-height: 40px; }
`

export const LoanInfo = styled.div`
  margin: 14px 0;
  padding: 11px 12px;
  background: ${({ theme }) => theme.colors.bgApp};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
`

export const Timeline = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const TimelineItem = styled.li`
  padding: 8px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  &:not(:last-child) { border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight}; }
`

export const Empty = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 30px 18px;
`

export const ErrorBox = styled.div`
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
`

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`

export const Overlay = styled.button`
  position: absolute;
  inset: 0;
  border: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

export const ModalBox = styled.div`
  position: relative;
  width: min(520px, 100%);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  @media (max-width: 480px) { padding: 20px 16px; }
`

export const ModalTitle = styled.h2`
  margin: 0 0 5px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
`

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

export const Input = styled.input`
  min-height: 42px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgApp};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const Textarea = styled.textarea`
  min-height: 72px;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgApp};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 9px 12px;
  font: inherit;
`

export const ModalActions = styled.div`
  display: flex;
  gap: 9px;
  justify-content: flex-end;
  margin-top: 6px;
  button { min-height: 43px; }
  @media (max-width: 480px) { button { flex: 1; } }
`

export const Help = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 400;
`
