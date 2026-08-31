import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
`

export const Pessoa = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};

  /*
    A linha passou a ter três coisas depois do #380 — nome, chamar e seguir —, e
    no celular elas não cabem lado a lado. Os dois botões descem juntos para uma
    segunda linha em vez de espremerem o nome, que é a informação que identifica
    a pessoa.
  */
  flex-wrap: wrap;
`

export const MiniAvatar = styled.div`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const NomeDaPessoa = styled(Link)`
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`

/**
 * "Chamar para jogar", em cada linha da lista (#380).
 *
 * **Discreto de propósito, e menos pesado que o `BotaoSeguir` ao lado.** Os dois
 * disputam a mesma linha, e o de seguir carrega o estado do vínculo — se os
 * dois gritassem igual, a linha teria dois assuntos com o mesmo peso e nenhum
 * leria como principal.
 */
export const BotaoChamar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  background: transparent;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`

export const Vazio = styled.p`
  margin: 16px 0 0;
  padding: 20px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

export const Erro = styled.p`
  margin: 16px 0 0;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`
