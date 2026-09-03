import styled from 'styled-components'

export const Voltar = styled.button`
  border: 0; background: none; color: ${({ theme }) => theme.colors.textSecondary}; cursor: pointer;
  display: inline-flex; gap: 8px; align-items: center; margin-bottom: 16px;
`
export const Caixa = styled.section`
  background: ${({ theme }) => theme.colors.bgCard}; border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px; padding: 20px;
`
export const Topo = styled.div`
  display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 18px;
  @media (max-width: 640px) { align-items: stretch; flex-direction: column; }
`
export const Titulo = styled.h2`margin: 0 0 4px; font-size: 1.15rem;`
export const Explicacao = styled.p`margin: 0; color: ${({ theme }) => theme.colors.textSecondary};`
export const CampoMes = styled.label`display: grid; gap: 5px; font-size: .82rem; font-weight: 700;`
export const Mes = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; padding: 9px 10px;
  color: ${({ theme }) => theme.colors.textPrimary}; background: ${({ theme }) => theme.colors.bgInput};
`
export const Lista = styled.ul`list-style: none; padding: 0; margin: 0; display: grid; gap: 10px;`
export const Linha = styled.li`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px; padding: 14px;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  @media (max-width: 640px) { align-items: stretch; flex-direction: column; }
`
export const Nome = styled.strong`display: block;`
export const Detalhe = styled.span`display: block; color: ${({ theme }) => theme.colors.textSecondary}; font-size: .84rem; margin-top: 3px;`
export const Selo = styled.span`font-size: .72rem; color: ${({ theme }) => theme.colors.warningText}; margin-left: 7px;`
export const Botao = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.primary}; border-radius: 8px; padding: 8px 12px;
  color: ${({ theme }) => theme.colors.primary}; background: transparent; cursor: pointer; font-weight: 700;
  &:disabled { opacity: .55; cursor: wait; }
`
export const Estado = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; margin: 12px 0 0;`
