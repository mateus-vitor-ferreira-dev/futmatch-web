import styled from 'styled-components'

export const Container = styled.div`
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 16px 48px;
`

export const Cabecalho = styled.header`
  margin-bottom: 24px;
`

export const Titulo = styled.h1`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Subtitulo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`
