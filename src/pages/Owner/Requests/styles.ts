import styled from 'styled-components'

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`

export const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const RequestCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 18px 20px 18px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const RequestAccent = styled.div`
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: ${({ color }) => color};
`

export const RequestHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
`

export const RequestTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
`

export const RequestMeta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

export const RequestDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 8px;
  line-height: 1.5;
`

export const RequestFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
`

export const RequestSentAt = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const StatusBadge = styled.span<{ bg?: string; }>`
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

export const NewBtn = styled.button`
  padding: 9px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
`

// ── Modal ─────────────────────────────────────────────────────────────────────

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

export const ModalBox = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`

export const ModalHeader = styled.div`
  margin-bottom: 20px;
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Input = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.bgApp};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const Textarea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
  background: ${({ theme }) => theme.colors.bgApp};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const FieldError = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`

export const CancelBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgApp};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`

export const SubmitBtn = styled.button`
  padding: 9px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: background 0.15s;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`
