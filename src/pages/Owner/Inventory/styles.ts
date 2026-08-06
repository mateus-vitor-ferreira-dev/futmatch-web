import styled from 'styled-components'

export const Toolbar = styled.div`display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:20px;>div:first-child{min-width:min(360px,100%)}@media(max-width:600px){align-items:stretch;flex-direction:column;}`
export const HeaderActions = styled.div`display:flex;gap:8px;`
export const Label = styled.label`display:block;font-size:12px;font-weight:600;color:${({theme})=>theme.colors.textSecondary};margin-bottom:6px;`
const field = `width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;font:inherit;`
export const Input = styled.input`${field}border:1px solid ${({theme})=>theme.colors.border};background:${({theme})=>theme.colors.bgInput};color:${({theme})=>theme.colors.textPrimary};`
export const Select = styled.select`${field}border:1px solid ${({theme})=>theme.colors.border};background:${({theme})=>theme.colors.bgInput};color:${({theme})=>theme.colors.textPrimary};`
export const Textarea = styled.textarea`${field}min-height:80px;resize:vertical;border:1px solid ${({theme})=>theme.colors.border};background:${({theme})=>theme.colors.bgInput};color:${({theme})=>theme.colors.textPrimary};`
export const PrimaryButton = styled.button`display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:8px;padding:11px 16px;background:${({theme})=>theme.colors.primary};color:${({theme})=>theme.colors.textOnPrimary};font-weight:700;cursor:pointer;&:disabled{opacity:.5;cursor:not-allowed}`
export const SecondaryButton = styled.button`display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;padding:9px 11px;background:${({theme})=>theme.colors.bgCard};color:${({theme})=>theme.colors.textSecondary};font-weight:600;cursor:pointer;`
export const StockSummary = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;@media(max-width:650px){grid-template-columns:1fr;}`
export const SummaryCard = styled.div<{$warning?:boolean}>`display:flex;align-items:center;gap:12px;padding:16px;background:${({theme})=>theme.colors.bgCard};border:1px solid ${({$warning,theme})=>$warning?theme.colors.warning:theme.colors.borderLight};border-radius:12px;svg{color:${({$warning,theme})=>$warning?theme.colors.warning:theme.colors.primary}}div{display:flex;flex-direction:column}strong{font-size:22px;color:${({theme})=>theme.colors.textPrimary}}span{font-size:12px;color:${({theme})=>theme.colors.textSecondary}}`
export const PageGrid = styled.div`display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:20px;align-items:start;@media(max-width:900px){grid-template-columns:1fr;}`
export const ProductGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;`
export const ProductCard = styled.article<{$low:boolean}>`padding:18px;background:${({theme})=>theme.colors.bgCard};border:1px solid ${({$low,theme})=>$low?theme.colors.warning:theme.colors.borderLight};border-radius:12px;box-shadow:${({theme})=>theme.shadows.sm};`
export const ProductHeader = styled.div`display:flex;justify-content:space-between;gap:10px;h3{margin:0 0 4px;color:${({theme})=>theme.colors.textPrimary};font-size:17px}`
export const ProductMeta = styled.span`font-size:12px;color:${({theme})=>theme.colors.textSecondary};`
export const AlertBadge = styled.span`display:flex;align-items:center;gap:4px;align-self:flex-start;padding:4px 7px;border-radius:999px;background:${({theme})=>theme.colors.warningLight};color:${({theme})=>theme.colors.warningText};font-size:10px;font-weight:700;white-space:nowrap;`
export const StockNumber = styled.div<{$low:boolean}>`display:flex;align-items:baseline;gap:7px;margin:18px 0;color:${({$low,theme})=>$low?theme.colors.warningText:theme.colors.textPrimary};strong{font-size:34px}span{font-size:12px;color:${({theme})=>theme.colors.textSecondary}}`
export const QuickSale = styled.div`display:grid;grid-template-columns:72px 1fr;gap:8px;margin-bottom:10px;`
export const SaleButton = styled(PrimaryButton)`padding:10px;background:#16a34a;`
export const Actions = styled.div`display:grid;grid-template-columns:1fr 1fr auto;gap:7px;@media(max-width:400px){grid-template-columns:1fr 1fr;.sc-placeholder{display:none}}`
export const HistoryCard = styled.aside`background:${({theme})=>theme.colors.bgCard};border:1px solid ${({theme})=>theme.colors.borderLight};border-radius:12px;padding:18px;h2{display:flex;align-items:center;gap:8px;margin:0 0 14px;font-size:17px;color:${({theme})=>theme.colors.textPrimary}}`
export const HistoryList = styled.div`display:flex;flex-direction:column;max-height:640px;overflow:auto;>p{color:${({theme})=>theme.colors.textMuted};font-size:13px}`
export const HistoryItem = styled.div<{$entry:boolean}>`display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid ${({theme})=>theme.colors.borderLight};.movement{display:flex;flex-direction:column;min-width:0}strong{font-size:13px;color:${({$entry})=>$entry?'#16a34a':'#dc2626'}}span,time{font-size:11px;color:${({theme})=>theme.colors.textMuted}}time{white-space:nowrap}`
export const EmptyState = styled.div`display:flex;align-items:center;justify-content:center;gap:8px;min-height:140px;color:${({theme})=>theme.colors.textMuted};text-align:center;svg{animation:spin 1s linear infinite}`
export const Modal = styled.div`position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;`
export const ModalOverlay = styled.button`position:absolute;inset:0;border:0;background:${({theme})=>theme.colors.bgOverlay};`
export const ModalBox = styled.div`position:relative;width:100%;max-width:540px;max-height:calc(100dvh - 32px);overflow:auto;padding:24px;background:${({theme})=>theme.colors.bgCard};border-radius:14px;box-shadow:${({theme})=>theme.shadows.lg};h2{margin:0 0 20px;font-size:19px;color:${({theme})=>theme.colors.textPrimary}}`
export const FormGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:14px;.wide{grid-column:1/-1}@media(max-width:480px){grid-template-columns:1fr;.wide{grid-column:auto}}`
export const ModalActions = styled.div`display:flex;justify-content:flex-end;gap:9px;margin-top:20px;@media(max-width:480px){button{flex:1}}`
