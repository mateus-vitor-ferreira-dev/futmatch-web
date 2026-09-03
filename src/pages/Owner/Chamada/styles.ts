import styled from 'styled-components'
export const Voltar = styled.button`border:0;background:none;color:${({theme})=>theme.colors.textSecondary};display:flex;gap:8px;margin-bottom:16px;cursor:pointer;`
export const Caixa = styled.section`background:${({theme})=>theme.colors.bgCard};border:1px solid ${({theme})=>theme.colors.border};border-radius:14px;padding:20px;margin-bottom:16px;`
export const Topo = styled.div`display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:16px;@media(max-width:640px){flex-direction:column;align-items:stretch;}`
export const Titulo = styled.h2`margin:0 0 4px;font-size:1.15rem;`
export const Ajuda = styled.p`margin:0;color:${({theme})=>theme.colors.textSecondary};`
export const Data = styled.input`background:${({theme})=>theme.colors.bgInput};color:${({theme})=>theme.colors.textPrimary};border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;padding:9px;`
export const Lista = styled.ul`list-style:none;margin:0;padding:0;display:grid;gap:10px;`
export const Linha = styled.li`border:1px solid ${({theme})=>theme.colors.border};border-radius:10px;padding:13px;display:flex;justify-content:space-between;align-items:center;gap:12px;`
export const Botao = styled.button`border:1px solid ${({theme})=>theme.colors.primary};color:${({theme})=>theme.colors.primary};background:transparent;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;&:disabled{opacity:.5;}`
export const Opcoes = styled.div`display:flex;gap:8px;flex-wrap:wrap;label{display:flex;gap:5px;align-items:center;}`
export const NaoChamado = styled.span`color:${({theme})=>theme.colors.warningText};font-size:.8rem;`
export const Estado = styled.p`color:${({theme})=>theme.colors.textSecondary};`
