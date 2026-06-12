import styled from 'styled-components'

/* ── Tabs ──────────────────────────────────────────────────────────────────── */
export const Tabs = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 4px;
  margin-bottom: 24px;
`

export const Tab = styled.button`
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

/* ── Form header ───────────────────────────────────────────────────────────── */
export const FormTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px;
`

export const FormSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 20px;
`

/* ── Google wrapper (botão oficial do Google centralizado) ──────────────────── */
export const GoogleWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4px;

  /* força o botão do Google a ocupar a largura total */
  & > div, & iframe { width: 100% !important; }
`

/* ── Google button (mantido para compatibilidade) ───────────────────────────── */
export const GoogleButton = styled.button`
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background: #f8f8f8;
    border-color: #bbb;
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }
`

/* ── Divider ───────────────────────────────────────────────────────────────── */
export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

/* ── Fields ────────────────────────────────────────────────────────────────── */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border: 1.5px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus { border-color: ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

/* ── Modalidade favorita ───────────────────────────────────────────────────── */
export const ModalidadeGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 2px;
`

export const ModalidadeOption = styled.button.attrs({ type: 'button' })`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.bgCard};
  color: ${({ $active, theme }) => $active ? theme.colors.primaryDark : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.semibold : theme.fontWeights.regular};
  cursor: pointer;
  transition: all 0.12s;

  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`

/* ── Submit ────────────────────────────────────────────────────────────────── */
export const SubmitButton = styled.button`
  width: 100%;
  height: 44px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.65; cursor: not-allowed; }
`

export const SwitchText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 10px 0 0;

  button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    &:hover { text-decoration: underline; }
  }
`

export const ForgotLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  text-align: right;
  display: block;
  margin-top: -4px;
  &:hover { color: ${({ theme }) => theme.colors.primary}; text-decoration: underline; }
`

export const LegalText = styled.p`
  text-align: center;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 14px 0 0;
  line-height: 1.5;

  a {
    color: ${({ theme }) => theme.colors.textSecondary};
    &:hover { color: ${({ theme }) => theme.colors.primary}; }
  }
`
