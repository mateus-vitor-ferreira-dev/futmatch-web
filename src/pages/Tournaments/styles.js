import styled from 'styled-components'

export const Container = styled.div`
  max-width: 1100px;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
`

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 4px 0 0;
`

export const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 18px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const FiltersBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`

export const FilterChip = styled.button`
  padding: 8px 16px;
  min-width: 90px;
  text-align: center;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primarySubtle : theme.colors.bgCard};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
`

export const TournamentCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
`

export const TournamentName = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const StatusBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  white-space: nowrap;
  background: ${({ $status, theme }) => {
    const map = {
      DRAFT:               theme.colors.borderLight,
      OPEN:                theme.colors.infoLight,
      REGISTRATION_CLOSED: theme.colors.warningLight,
      IN_PROGRESS:         theme.colors.warningLight,
      FINISHED:            theme.colors.successLight,
      CANCELLED:           theme.colors.errorLight,
    }
    return map[$status] ?? theme.colors.borderLight
  }};
  color: ${({ $status, theme }) => {
    const map = {
      DRAFT:               theme.colors.textMuted,
      OPEN:                theme.colors.info,
      REGISTRATION_CLOSED: theme.colors.warningText,
      IN_PROGRESS:         theme.colors.warningText,
      FINISHED:            theme.colors.success,
      CANCELLED:           theme.colors.error,
    }
    return map[$status] ?? theme.colors.textMuted
  }};
`

export const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const ViewBracketBtn = styled.button`
  width: 100%;
  padding: 9px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
  }
`

export const BracketSection = styled.div`
  margin-top: 8px;
`

export const BracketTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`

export const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 32px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  transition: border-color 0.15s;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`

export const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.textSecondary}; }
`

export const SubmitButton = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    font-size: 3rem;
    display: block;
    margin-bottom: 12px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin: 0;
  }
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const FormatHint = styled.div`
  margin-top: 6px;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.primarySubtle};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0 ${({ theme }) => theme.radii.sm} ${({ theme }) => theme.radii.sm} 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`

export const CategorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const CatChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

export const PresetChip = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySubtle};
  }
`

export const CatTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

export const CatTagRemove = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  line-height: 1;

  &:hover { color: #fff; }
`

export const CatInput = styled.input`
  flex: 1;
  min-width: 130px;
  padding: 4px 10px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  outline: none;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`