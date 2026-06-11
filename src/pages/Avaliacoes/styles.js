import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`

export const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  color: white;
  display: flex;
  justify-content: space-around;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.md};

  .stat-item {
    text-align: center;
    h2 {
      font-size: ${({ theme }) => theme.fontSizes['3xl']};
      margin-bottom: 4px;
    }
    p {
      opacity: 0.8;
      font-size: ${({ theme }) => theme.fontSizes.sm};
    }
  }
`

export const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
`

export const TagsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const TagChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};

  .label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primaryDark};
  }

  .count {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-radius: ${({ theme }) => theme.radii.full};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 700;
    padding: 2px 8px;
  }
`

export const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const ReviewCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primaryDark};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
  }

  .meta {
    flex: 1;

    .reviewer-name {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.textPrimary};
      font-size: ${({ theme }) => theme.fontSizes.md};
    }

    .game-info {
      font-size: ${({ theme }) => theme.fontSizes.xs};
      color: ${({ theme }) => theme.colors.textSecondary};
      margin-top: 2px;
    }
  }

  .stars {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    white-space: nowrap;
  }
`

export const TagBadge = styled.span`
  display: inline-block;
  background: ${({ theme }) => theme.colors.infoLight};
  color: ${({ theme }) => theme.colors.info};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px 10px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`

export const ReviewComment = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[2]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.textMuted};

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin-top: ${({ theme }) => theme.spacing[3]};
  }
`
