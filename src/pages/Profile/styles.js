import styled from 'styled-components'

export const PageWrapper = styled.div`
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 0;
`

// ── Avatar ────────────────────────────────────────────────────────────────────

export const AvatarBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const AvatarUploadWrapper = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
`

export const AvatarOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.2s;

  ${AvatarUploadWrapper}:hover & {
    opacity: 1;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  svg.spinning {
    animation: spin 0.8s linear infinite;
  }
`

export const AvatarCircle = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const AvatarInitials = styled.span`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #fff;
`

export const AvatarHint = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

// ── Tabs ──────────────────────────────────────────────────────────────────────

export const TabsRow = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 4px;
  margin-bottom: 24px;
`

export const TabBtn = styled.button`
  flex: 1;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  background: ${({ $active, theme }) => $active ? theme.colors.bgCard : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.textPrimary : theme.colors.textSecondary};
  box-shadow: ${({ $active, theme }) => $active ? theme.shadows.sm : 'none'};
`

// ── Password step 2 reveal ────────────────────────────────────────────────────

export const StepBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
  border-top: 1.5px dashed ${({ theme }) => theme.colors.border};
`

// ── Layout ────────────────────────────────────────────────────────────────────

export const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 24px 0;
`

export const Section = styled.section``

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 16px;
`

// ── Form ──────────────────────────────────────────────────────────────────────

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`

export const Field = styled.div`
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
  background: ${({ theme }) => theme.colors.bgCard};
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const FieldError = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const SaveBtn = styled.button`
  align-self: flex-start;
  padding: 9px 24px;
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

export const SuccessMsg = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.successLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 8px 12px;
  margin: 0;
`

export const ErrorMsg = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 8px 12px;
  margin: 0;
`

// ── Logout ────────────────────────────────────────────────────────────────────

export const LogoutSection = styled.section``

export const LogoutBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.error};
    color: #fff;
  }
`
