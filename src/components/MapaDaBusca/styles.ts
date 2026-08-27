import styled from 'styled-components'

export const Moldura = styled.div`
  height: 320px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  /* O Leaflet posiciona os painéis em absoluto e o container precisa ancorá-los. */
  .leaflet-container {
    background: ${({ theme }) => theme.colors.bgCard};
    font-family: inherit;
  }

  @media (max-width: 640px) {
    height: 240px;
  }
`
