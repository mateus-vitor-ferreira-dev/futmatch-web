import styled from 'styled-components'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

// ── Compact Header ──────────────────────────────────────────────────────────

export const CompactHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const GreetingText = styled.p`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

export const GreetingTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  line-height: 1.2;
`

// ── Stats Row ─────────────────────────────────────────────────────────────────

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`

export const StatBox = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 480px) {
    padding: 14px;
    gap: 10px;
  }
`

export const StatIconBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.primarySubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
`

export const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`

export const StatValue = styled.span`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`

export const StatLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`

// ── Sport Tabs ────────────────────────────────────────────────────────────────

export const TabsWrapper = styled.div`
  position: relative;
`

export const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { display: none; }
`

export const TabsFade = styled.div<{ $side: 'left' | 'right'; $visible: boolean; }>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $side }) => $side}: 0;
  width: 32px;
  pointer-events: none;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.15s;
  background: ${({ $side, theme }) => `linear-gradient(to ${$side === 'left' ? 'right' : 'left'}, ${theme.colors.bgApp}, transparent)`};
`

export const Tab = styled.button<{ $active?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.bgCard};
  color: ${({ $active, theme }) => $active ? theme.colors.white : theme.colors.textPrimary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fonts.sans};
  flex-shrink: 0;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.primarySubtle};
    color: ${({ $active, theme }) => $active ? 'white' : theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

// ── Section ───────────────────────────────────────────────────────────────────

export const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
`

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const SectionSubtitle = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 4px 0 0;
`

export const SeeAllBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  font-family: ${({ theme }) => theme.fonts.sans};
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`

// ── Game Cards ────────────────────────────────────────────────────────────────

export const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const GameCardWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }
`

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`

export const CardCourtIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primarySubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`

export const CardCourtInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
`

export const CourtName = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SportBadge = styled.span`
  display: inline-block;
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
`

export const VagasBadge = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
`

export const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const CardBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const PlayerCount = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const Price = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`

export const ProgressBar = styled.div`
  width: 100%;
  height: 5px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: 999px;
  overflow: hidden;
`

export const ProgressFill = styled.div<{ $pct?: number; }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 999px;
  transition: width 0.3s ease;
`

export const EmptyState = styled.div`
  padding: 40px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

// ── CTA Buttons ───────────────────────────────────────────────────────────────

export const CTARow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const CTAPrimary = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const CTASecondary = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  border: 1.5px solid transparent;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`
