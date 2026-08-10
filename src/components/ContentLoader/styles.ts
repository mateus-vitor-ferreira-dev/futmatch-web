import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  /* Altura mínima em vez de 100vh: o loader vive dentro do conteúdo, e a
     sidebar e a topbar continuam na tela durante a troca de rota. */
  min-height: 240px;
  padding: 48px 0;
`

export const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`
