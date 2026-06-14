import styled from 'styled-components'

export const Page = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
`

/* ── Coluna esquerda (hero) ─────────────────────────────────────────────────── */
export const HeroCol = styled.aside`
  display: none;
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #14532d 0%, #15803d 60%, #16a34a 100%);
  padding: 56px 48px;
  flex-direction: column;
  justify-content: center;
  color: #fff;

  @media (min-width: 900px) {
    display: flex;
  }
`

export const HeroLogo = styled.div`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 40px;

  span {
    display: block;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.75;
    margin-top: 4px;
  }
`

export const HeroTitle = styled.h1`
  font-size: 26px;
  font-weight: 800;
  line-height: 1.25;
  margin: 0 0 12px;
`

export const HeroSub = styled.p`
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.6;
  margin: 0 0 36px;
`

export const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const BenefitItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }
`

/* ── Coluna direita (formulário) ─────────────────────────────────────────────── */
export const FormCol = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
`

export const Card = styled.div`
  width: 100%;
  max-width: 420px;
`

export const CardHead = styled.div`
  margin-bottom: 28px;
`

export const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
`

export const CardSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

/* ── Tabs ────────────────────────────────────────────────────────────────────── */
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

/* ── Form fields ─────────────────────────────────────────────────────────────── */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.primary};
  }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const SubmitBtn = styled.button`
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

export const LockBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.primaryLight ?? '#dcfce7'};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primaryDark ?? '#15803d'};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: 20px;
`
