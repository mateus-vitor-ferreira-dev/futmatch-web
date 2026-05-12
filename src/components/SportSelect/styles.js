import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

export const Trigger = styled.button.attrs({ type: 'button' })`
  width: 100%;
  min-height: 40px;
  padding: 6px 10px;
  border: 1.5px solid ${({ $open, theme }) => $open ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #fff;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  transition: border-color 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`

export const Placeholder = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  line-height: 1.6;
`

export const TagRemove = styled.span`
  cursor: pointer;
  line-height: 1;
  font-size: 13px;
  opacity: 0.6;
  &:hover { opacity: 1; }
`

export const ChevronIcon = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
  transition: transform 0.15s;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0)'};
`

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;  /* scroll do dropdown não propaga para a página */
  z-index: 50;

  /* scrollbar fina */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
`

export const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ $selected, theme }) => $selected ? theme.colors.primarySubtle : 'transparent'};
  transition: background 0.1s;

  &:hover { background: ${({ theme }) => theme.colors.primarySubtle}; }
`

export const Checkbox = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid ${({ $checked, theme }) => $checked ? theme.colors.primary : theme.colors.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.primary : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10px;
  color: #fff;
  transition: all 0.1s;
`

export const OptionIcon = styled.span`font-size: 16px; line-height: 1;`
