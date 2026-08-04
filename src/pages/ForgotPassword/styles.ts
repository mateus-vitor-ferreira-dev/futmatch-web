import styled from 'styled-components'

export const SuccessBox = styled.p`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 12px 0 0;
  text-align: center;
`
