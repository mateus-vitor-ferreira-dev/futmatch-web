import styled from 'styled-components'

export const Bloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const Explicacao = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  list-style: none;
  padding: 0;
  margin: 0;
`

export const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};

  .icone {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    flex-shrink: 0;
  }

  .texto {
    flex: 1;
    min-width: 0;
  }

  .modalidade {
    display: block;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .detalhe {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .acoes {
    display: flex;
    gap: ${({ theme }) => theme.spacing[1]};
    flex-shrink: 0;
  }
`

export const BotaoDeItem = styled.button<{ $perigo?: boolean; }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme, $perigo }) => ($perigo ? theme.colors.errorLight : theme.colors.border)};
  background: ${({ theme, $perigo }) => ($perigo ? theme.colors.errorLight : theme.colors.bgCard)};
  color: ${({ theme, $perigo }) => ($perigo ? theme.colors.error : theme.colors.textSecondary)};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme, $perigo }) => ($perigo ? theme.colors.error : theme.colors.primary)};
    color: ${({ theme, $perigo }) => ($perigo ? theme.colors.error : theme.colors.primary)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Vazio = styled.div`
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
`

export const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgPage};
`

export const Campos = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[3]};

  /* No celular os dois selects lado a lado cortam o rótulo da modalidade, que é
     o texto mais longo dos dois. É onde a pelada é organizada, então é o
     tamanho que manda. */
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  select {
    width: 100%;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radii.sm};
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 1px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .ajuda {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const AcoesDoFormulario = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;

  button {
    padding: 10px ${({ theme }) => theme.spacing[4]};
    border-radius: ${({ theme }) => theme.radii.sm};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    cursor: pointer;
    border: 1px solid transparent;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancelar {
    background: transparent;
    color: ${({ theme }) => theme.colors.textSecondary};
    border-color: ${({ theme }) => theme.colors.border};
  }

  .salvar {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }
`

export const AdicionarBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Erro = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
`
