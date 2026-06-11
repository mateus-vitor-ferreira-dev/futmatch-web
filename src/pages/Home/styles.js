import styled from 'styled-components'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

// ── Hero Banner ───────────────────────────────────────────────────────────────

export const HeroBanner = styled.div`
  background: linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%);
  border-radius: 16px;
  padding: 28px 32px;
  position: relative;
  overflow: hidden;
  color: white;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 12px;
  }
`

export const HeroDecor1 = styled.div`
  position: absolute;
  top: -32px;
  right: -32px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
`

export const HeroDecor2 = styled.div`
  position: absolute;
  top: 20px;
  right: 60px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  pointer-events: none;
`

export const HeroGreeting = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 8px;
`

export const HeroTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 800;
  color: white;
  margin: 0 0 10px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`

export const HeroSubtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  max-width: 480px;
`

// ── Stats Row ─────────────────────────────────────────────────────────────────

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
    padding: 12px;
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
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

export const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const Tab = styled.button`
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

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.primarySubtle};
    color: ${({ $active, theme }) => $active ? 'white' : theme.colors.primary};
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

export const ProgressFill = styled.div`
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

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const CTAPrimary = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const CTASecondary = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  border: 1.5px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    filter: brightness(0.95);
  }
`

// ── Explore by Modality ───────────────────────────────────────────────────────

export const ModalityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const ModalityCard = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySubtle};
  }
`

export const ModalityIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primarySubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`

export const ModalityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`

export const ModalityName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const ModalityCount = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

// ── Tip Card ──────────────────────────────────────────────────────────────────

export const TipCard = styled.div`
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

export const TipIcon = styled.div`
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 1px;
`

export const TipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

export const TipTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.warningText};
`

export const TipText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.warningText};
  margin: 0;
  line-height: 1.5;
`
