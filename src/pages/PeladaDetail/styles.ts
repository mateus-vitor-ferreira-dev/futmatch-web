import styled from 'styled-components'

export const Container = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  transition: color 0.15s;
  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};
`

export const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const SportIcon = styled.div`
  font-size: 2.5rem;
  line-height: 1;
  flex-shrink: 0;
`

export const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const CourtName = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing[1]};
  line-height: 1.25;
`

export const PlaceName = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`

export const StatusBadge = styled.span<{ $status?: string; }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  flex-shrink: 0;
  background: ${({ $status, theme }) =>
    $status === 'WAITING'   ? theme.colors.successLight  :
    $status === 'FULL'      ? theme.colors.warningLight  :
    $status === 'FINISHED'  ? theme.colors.infoLight     :
    $status === 'CANCELLED' ? theme.colors.errorLight    : theme.colors.borderLight};
  color: ${({ $status, theme }) =>
    $status === 'WAITING'   ? theme.colors.primaryDark   :
    $status === 'FULL'      ? theme.colors.warningText   :
    $status === 'FINISHED'  ? theme.colors.info          :
    $status === 'CANCELLED' ? theme.colors.error         : theme.colors.textSecondary};
`

export const Body = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[3]};
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

export const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.bgPage};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const InfoIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  margin-top: 1px;
`

export const InfoLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

export const InfoValue = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0;
`

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: 0;
`

export const ProgressSection = styled.div``

export const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const ProgressText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const VagasText = styled.span<{ $isFull?: boolean; }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ $isFull, theme }) => $isFull ? theme.colors.error : theme.colors.primary};
`

export const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`

export const ProgressFill = styled.div<{ $isFull?: boolean; $pct?: number; }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $isFull, theme }) => $isFull ? theme.colors.error : theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 0.3s;
`

export const PixBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.primarySubtle};
  border: 1px solid ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

export const PixLabel = styled.span`
  /* Rótulo e chave são dois spans irmãos: sem o block eles saem na mesma linha,
     colados, e a tela mostrava "CHAVE PIXfulano@exemplo.com". */
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const PixKey = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  word-break: break-all;
`

export const CopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 6px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
`

/**
 * `$bloqueado` é o botão barrado pelo portão de entrada (#230).
 *
 * Compartilha o visual neutro do `$full` de propósito — os dois querem dizer
 * "não é para você clicar aqui" —, mas é prop própria porque o motivo é outro:
 * lotado muda quando alguém sai, e requisito não. Reaproveitar o `$full` faria
 * a tela chamar de "cheia" uma pelada com vaga sobrando.
 */
export const JoinBtn = styled.button<{ $full?: boolean; $joined?: boolean; $bloqueado?: boolean; }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.15s, opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: ${({ $joined, $full, $bloqueado, theme }) =>
    $joined              ? theme.colors.successLight :
    $full || $bloqueado  ? theme.colors.borderLight  : theme.colors.primary};
  color: ${({ $joined, $full, $bloqueado, theme }) =>
    $joined              ? theme.colors.primaryDark  :
    $full || $bloqueado  ? theme.colors.textMuted    : '#fff'};
  opacity: ${({ disabled }) => disabled ? 0.75 : 1};
  &:hover:not(:disabled) { background: ${({ $joined, theme }) => $joined ? theme.colors.successLight : theme.colors.primaryHover}; }
`

export const OrganizerActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const ActionBtn = styled.button<{ $variant?: string; }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $variant, theme }) => $variant === 'danger' ? theme.colors.error : theme.colors.border};
  background: ${({ $variant, theme }) => $variant === 'danger' ? theme.colors.errorLight : theme.colors.bgCard};
  color: ${({ $variant, theme }) => $variant === 'danger' ? theme.colors.error : theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const OrganizerTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.bgPage};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  width: fit-content;
`

export const ParticipantsSection = styled.div``

export const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${({ theme }) => theme.spacing[3]};
`

/**
 * A contagem que o visitante sem sessão vê no lugar da lista (#302).
 *
 * Ocupa o lugar da lista, e não o de um aviso: quem está deslogado não precisa
 * saber que existe uma lista escondida — precisa saber quantas vagas foram.
 */
export const ParticipantsCount = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`

export const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.bgPage};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const ParticipantName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const ParticipantNickname = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 4px;
`

export const AvatarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const MapLink = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.info};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  &:hover { text-decoration: underline; }
`

export const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

/* ── Sair da pelada ─────────────────────────────────────────────────────── */

export const LeaveBtn = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  transition: color 0.15s, border-color 0.15s;

  /* Discreto de propósito: sair é uma saída, não uma ação que se promove
     ao lado do "Você está confirmado". Só ganha a cor de perigo no hover. */
  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.error};
    border-color: ${({ theme }) => theme.colors.error};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

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
  width: calc(100% - 32px);
  max-width: 440px;
  box-shadow: ${({ theme }) => theme.shadows.lg};

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 0 12px;
  }
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 12px;
`

export const ReasonInput = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgApp};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`

export const ReasonCounter = styled.span`
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`

export const ModalCancelBtn = styled.button`
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

export const ModalConfirmBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

/** O motivo de o botão de entrar estar desabilitado (#230). */
export const MotivoDoPortao = styled.p`
  margin: 8px 0 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/**
 * A tela de link de convite que não vale mais (#229).
 *
 * Ocupa o corpo do cartão em vez de virar um toast: o toast some, e quem chegou
 * por um link morto precisa poder ler o motivo com calma e mostrá-lo para quem
 * mandou o link.
 */
export const LinkInvalidoBox = styled.div`
  text-align: center;
  padding: 48px 20px;

  span {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 16px;
  }
`

export const LinkInvalidoTitulo = styled.h2`
  font-size: 1.125rem;
  color: #111827;
  margin: 0 0 8px;
`

export const LinkInvalidoTexto = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  max-width: 340px;
  margin-inline: auto;
`
