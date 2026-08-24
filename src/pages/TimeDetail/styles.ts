import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1000px;
  margin: 0 auto;
`

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:hover { color: ${({ theme }) => theme.colors.primary}; }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
    border-radius: 4px;
  }
`

export const Hero = styled.header`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .meta span {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing[2]};
  }
`

export const CaptainActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[5]};
  padding-top: ${({ theme }) => theme.spacing[5]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

  /* Empilha no celular: dois botões lado a lado numa tela estreita viram dois
     alvos pequenos e grudados, e o de apagar é o pior lugar para errar o dedo. */
  @media (max-width: 640px) {
    flex-direction: column;
  }
`

export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
`

export const MemberList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`

export const MemberCard = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[3]};

  .avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primaryDark};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    overflow: hidden;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nome {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .papel {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

export const CaptainBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`

export const PartidaList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const PartidaCard = styled.li`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  a {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.spacing[4]};
    color: inherit;
    text-decoration: none;
    border-radius: inherit;
  }

  a:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  .quando {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .onde {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }

  .vagas {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`

export const StatusChip = styled.span<{ $tom: 'aberta' | 'cheia' | 'fim' | 'cancelada' }>`
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;

  background: ${({ theme, $tom }) =>
    $tom === 'aberta'    ? theme.colors.successLight
    : $tom === 'cheia'   ? theme.colors.warningLight
    : $tom === 'cancelada' ? theme.colors.errorLight
    : theme.colors.borderLight};

  color: ${({ theme, $tom }) =>
    $tom === 'aberta'    ? theme.colors.primaryDark
    : $tom === 'cheia'   ? theme.colors.warningText
    : $tom === 'cancelada' ? theme.colors.error
    : theme.colors.textSecondary};
`

export const EmptyState = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const ErrorState = styled.div`
  background: ${({ theme }) => theme.colors.errorLight};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
