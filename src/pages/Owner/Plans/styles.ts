import styled from 'styled-components'

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

export const UsageCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: 24px;

  h2 {
    font-size: 16px;
    margin: 0 0 16px;
  }
`

export const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const UsageItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const UsageLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const UsageValue = styled.span<{ $exceeded?: boolean; }>`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ $exceeded, theme }) => $exceeded ? theme.colors.warningText : theme.colors.textPrimary};
`

export const UsageBar = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
`

export const UsageBarFill = styled.div<{ $pct: number; $exceeded?: boolean; }>`
  height: 100%;
  width: ${({ $pct }) => Math.min(100, $pct)}%;
  background: ${({ $exceeded, theme }) => $exceeded ? theme.colors.warning : theme.colors.primary};
  transition: width 0.2s;
`

export const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const PlanCard = styled.div<{ $current?: boolean; }>`
  position: relative;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 2px solid ${({ $current, theme }) => $current ? theme.colors.primary : theme.colors.borderLight};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const CurrentBadge = styled.span`
  position: absolute;
  top: -12px;
  left: 24px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding: 4px 12px;
  border-radius: 999px;
`

export const PlanName = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const PlanPrice = styled.div`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    font-size: 13px;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

export const PlanFeatures = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  svg { flex-shrink: 0; color: ${({ theme }) => theme.colors.primary}; }
`

export const PlanButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'current'; }>`
  padding: 12px;
  border-radius: 8px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: 14px;
  cursor: pointer;
  border: ${({ $variant, theme }) => $variant === 'secondary'
    ? `1px solid ${theme.colors.border}`
    : $variant === 'current' ? `1px solid ${theme.colors.primaryLight}` : 'none'};
  background: ${({ $variant, theme }) => $variant === 'secondary'
    ? 'transparent'
    : $variant === 'current' ? theme.colors.primaryLight : theme.colors.primary};
  color: ${({ $variant, theme }) => $variant === 'secondary'
    ? theme.colors.textSecondary
    : $variant === 'current' ? theme.colors.primaryDark : theme.colors.textOnPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: ${({ $variant }) => $variant === 'current' ? 1 : 0.6};
    cursor: ${({ $variant }) => $variant === 'current' ? 'default' : 'not-allowed'};
  }
`

// ── Modal de troca de plano ─────────────────────────────────────────────────

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
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

  @media (max-width: 480px) {
    padding: 22px 18px;
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
  }
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 20px;
`

export const EffectRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 14px;

  .label { color: ${({ theme }) => theme.colors.textSecondary}; }
  .value { color: ${({ theme }) => theme.colors.textPrimary}; font-weight: ${({ theme }) => theme.fontWeights.semibold}; }

  @media (max-width: 480px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
`

export const WarningBox = styled.div`
  display: flex;
  gap: 10px;
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  color: ${({ theme }) => theme.colors.warningText};
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  margin-top: 16px;

  svg { flex-shrink: 0; }
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;

  @media (max-width: 480px) {
    flex-direction: column-reverse;

    button { width: 100%; }
  }
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
`

export const ConfirmBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const CenteredSpinner = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
`

/**
 * Aviso de downgrade agendado.
 *
 * Fica no topo da página, antes do uso e dos cards: é a resposta à pergunta
 * "minha troca pegou?", e ela precisa aparecer sem rolagem.
 */
export const ScheduledBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  color: ${({ theme }) => theme.colors.warningText};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px 16px;
  margin-bottom: 20px;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  svg { flex-shrink: 0; margin-top: 2px; }

  div { flex: 1; }

  strong { display: block; margin-bottom: 4px; }

  p { margin: 0; opacity: 0.9; }

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`

export const CancelScheduleBtn = styled.button`
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  background: transparent;
  color: inherit;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`
