import styled from 'styled-components'

export const Bloco = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: ${({ theme }) => theme.spacing[3]};
  }
`

export const Lista = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const Convite = styled.li<{ $vencido: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme, $vencido }) => ($vencido ? theme.colors.border : theme.colors.primary)};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};

  /* O vencido continua legível, só perde o destaque: apagá-lo até o ilegível
     seria a mesma coisa que escondê-lo, que é justamente o que a issue não
     quer. */
  opacity: ${({ $vencido }) => ($vencido ? 0.75 : 1)};

  .texto {
    flex: 1 1 240px;
  }

  .titulo {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .detalhe {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    margin-top: 2px;
  }
`

export const Acoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};

  /* No celular os botões ocupam a linha inteira: lado a lado com o texto do
     convite, viram dois alvos estreitos e grudados. */
  @media (max-width: 520px) {
    width: 100%;
    button { flex: 1; }
  }
`

const botao = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const Aceitar = styled.button`
  ${botao}
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  border: none;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryDark};
    outline-offset: 2px;
  }
`

export const Recusar = styled.button`
  ${botao}
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.borderLight}; }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const Vencido = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 4px ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`
