import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`

/**
 * Voltar, no mesmo desenho do `BackBtn` do detalhe da pelada — botão de texto
 * com a seta, sem moldura. Copiado de propósito: é o gesto que a pessoa já
 * aprendeu nas outras telas, e um botão diferente aqui pareceria outra coisa.
 */
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
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  transition: color 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

export const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`

export const FiltersArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`

export const SearchInput = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 0 ${({ theme }) => theme.spacing[4]};

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
    margin-right: ${({ theme }) => theme.spacing[2]};
  }

  input {
    flex: 1;
    padding: ${({ theme }) => theme.spacing[3]} 0;
    border: none;
    outline: none;
    font-family: ${({ theme }) => theme.fonts.sans};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const ChipsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing[2]};

  &::-webkit-scrollbar {
    display: none;
  }
`

export const Chip = styled.button<{ $active?: boolean; }>`
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.bgCard};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.bgCard : theme.colors.textSecondary};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.border};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`

export const ViewToggle = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  flex-shrink: 0;
  height: fit-content;
`

export const ToggleBtn = styled.button<{ $active?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.bgCard};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primaryHover : theme.colors.primarySubtle};
    color: ${({ $active, theme }) => $active ? 'white' : theme.colors.primary};
  }
`

export const MapWrapper = styled.div`
  width: 100%;
  height: calc(100vh - 320px);
  min-height: 420px;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const ResultsCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s, transform 0.15s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: 4px;
  }

  .address {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .badge {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.primaryDark};
    background: ${({ theme }) => theme.colors.primaryLight};
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radii.md};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

export const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const ProgressBarContainer = styled.div`
  margin: ${({ theme }) => theme.spacing[4]} 0;
`

export const ProgressBar = styled.div<{ $isFull?: boolean; $progress?: number; }>`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  margin-bottom: 8px;

  div {
    height: 100%;
    background: ${({ theme, $isFull }) =>
      $isFull ? theme.colors.error : theme.colors.primary};
    width: ${({ $progress }) => `${$progress}%`};
    transition: width 0.3s ease;
  }
`

export const SpotsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

export const PriceInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  margin-top: auto;
`

export const FiltersBtn = styled.button<{ $active?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  height: 46px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primarySubtle : theme.colors.bgCard};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const ActiveFilterBadge = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`

export const AdvancedFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.bgPage || '#f9fafb'};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: flex-end;
`

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const FilterLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

export const FilterSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.sans};
  cursor: pointer;
  min-width: 180px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const FilterToggle = styled.button<{ $active?: boolean; }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: ${({ theme }) => theme.spacing[2]} 0;

  .toggle-track {
    width: 36px;
    height: 20px;
    border-radius: 999px;
    background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '18px' : '2px'};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
`

export const PriceSliderWrapper = styled.div<{ $pct?: number; }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  input[type='range'] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 999px;
    background: ${({ theme, $pct }) =>
      `linear-gradient(to right, ${theme.colors.primary} ${$pct}%, ${theme.colors.border} ${$pct}%)`};
    cursor: pointer;
    outline: none;
    border: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.primary};
      cursor: pointer;
      border: 2px solid ${({ theme }) => theme.colors.bgCard};
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.primary};
      cursor: pointer;
      border: 2px solid ${({ theme }) => theme.colors.bgCard};
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
  }
`

export const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error || '#ef4444'};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: ${({ theme }) => theme.fonts.sans};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]} 0;
  margin-left: auto;
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:hover { text-decoration: underline; }
`

export const ActionButton = styled.button<{ $isJoined?: boolean; }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  background: ${({ theme, disabled, $isJoined }) =>
    $isJoined
      ? theme.colors.primarySubtle
      : disabled
        ? theme.colors.borderLight
        : theme.colors.primary};

  color: ${({ theme, disabled, $isJoined }) =>
    $isJoined
      ? theme.colors.primaryDark
      : disabled
        ? theme.colors.textMuted
        : theme.colors.bgCard};

  border: 1px solid
    ${({ theme, $isJoined }) =>
      $isJoined ? theme.colors.primary : 'transparent'};

  &:hover:not(:disabled) {
    background: ${({ theme, $isJoined }) =>
      $isJoined ? theme.colors.primaryLight : theme.colors.primaryHover};
  }
`

export const SportBtnsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const SportAllBtn = styled.button<{ $active?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 ${({ theme }) => theme.spacing[5]};
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.bgCard};
  color: ${({ $active, theme }) => $active ? '#fff' : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const SportSelectWrapper = styled.div<{ $active?: boolean; }>`
  position: relative;
  display: flex;
  align-items: center;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 ${({ theme }) => theme.spacing[5]};
    height: 40px;
    border-radius: ${({ theme }) => theme.radii.full};
    border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
    background: ${({ $active, theme }) => $active ? theme.colors.primarySubtle : theme.colors.bgCard};
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  select {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    font-size: 1rem;
  }
`

/**
 * O filtro de raio (#224).
 *
 * Fica numa linha própria, e não junto dos outros, porque ele muda **de onde**
 * a busca parte, e não o que ela devolve — e porque ele pode estar
 * indisponível, o que nenhum outro filtro fica.
 */
export const RaioLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`

export const RaioChip = styled.button<{ $ativo: boolean }>`
  padding: 6px ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ $ativo, theme }) => ($ativo ? theme.colors.primary : theme.colors.border)};
  background: ${({ $ativo, theme }) => ($ativo ? theme.colors.primaryLight : theme.colors.bgCard)};
  color: ${({ $ativo, theme }) => ($ativo ? theme.colors.primaryDark : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const RaioExplicacao = styled.p`
  margin: 0;
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.45;

  button {
    border: 0;
    background: none;
    padding: 0;
    color: ${({ theme }) => theme.colors.primary};
    font: inherit;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    cursor: pointer;
    text-decoration: underline;
  }
`

export const DistanciaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`
